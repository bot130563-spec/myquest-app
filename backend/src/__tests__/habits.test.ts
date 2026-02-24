/**
 * Tests pour les routes d'habitudes
 * Teste: GET /api/habits, POST /api/habits, POST /api/habits/:id/complete (streak logic)
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    habit: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    habitLog: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    avatar: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stats: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

import app from '../index';
import { prisma } from '../config/database';

describe('Habit Routes', () => {
  let authToken: string;
  const userId = 'test-user-123';

  beforeAll(() => {
    // Génère un token JWT valide pour les tests
    authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/habits', () => {
    it('devrait retourner la liste des habitudes de l\'utilisateur', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          userId,
          title: 'Méditation',
          description: '10 minutes',
          icon: '🧘',
          category: 'ENERGY',
          frequency: 'DAILY',
          targetDays: [],
          targetCount: 1,
          xpReward: 10,
          statBoost: 1,
          isActive: true,
          reminderTime: null,
          currentStreak: 5,
          longestStreak: 10,
          totalCompletions: 25,
          streakCount: 5,
          lastCompletedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.habit.findMany as jest.Mock).mockResolvedValue(mockHabits);

      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('habits');
      expect(response.body.habits).toHaveLength(1);
      expect(response.body.habits[0].title).toBe('Méditation');
      expect(response.body).toHaveProperty('count', 1);
    });

    it('devrait rejeter les requêtes sans token', async () => {
      const response = await request(app).get('/api/habits');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/habits', () => {
    it('devrait créer une nouvelle habitude', async () => {
      const newHabit = {
        id: 'habit-new',
        userId,
        title: 'Course',
        description: '5 km',
        icon: '🏃',
        category: 'HEALTH',
        frequency: 'DAILY',
        targetDays: [],
        targetCount: 1,
        xpReward: 10,
        statBoost: 1,
        isActive: true,
        reminderTime: null,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        streakCount: 0,
        lastCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.habit.create as jest.Mock).mockResolvedValue(newHabit);

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Course',
          description: '5 km',
          icon: '🏃',
          category: 'HEALTH',
          frequency: 'DAILY',
          targetDays: [],
          targetCount: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('créée');
      expect(response.body.habit.title).toBe('Course');
    });

    it('devrait rejeter une habitude avec des données invalides', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Titre vide = invalide
          category: 'INVALID_CATEGORY',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/habits/:id/complete', () => {
    it('devrait marquer une habitude comme complétée et incrémenter le streak', async () => {
      const mockHabit = {
        id: 'habit-1',
        userId,
        title: 'Méditation',
        icon: '🧘',
        category: 'ENERGY',
        xpReward: 10,
        statBoost: 1,
        currentStreak: 5,
        longestStreak: 10,
        isActive: true,
      };

      const mockAvatar = {
        id: 'avatar-1',
        userId,
        level: 2,
        experience: 50,
      };

      const mockStats = {
        id: 'stats-1',
        userId,
        energy: 60,
      };

      (prisma.habit.findFirst as jest.Mock).mockResolvedValue(mockHabit);
      (prisma.habitLog.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock la transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          habitLog: {
            findUnique: jest.fn().mockResolvedValue(null), // Pas de log hier
            create: jest.fn().mockResolvedValue({}),
          },
          habit: {
            update: jest.fn().mockResolvedValue({}),
          },
          avatar: {
            findUnique: jest.fn().mockResolvedValue(mockAvatar),
            update: jest.fn().mockResolvedValue({}),
          },
          stats: {
            findUnique: jest.fn().mockResolvedValue(mockStats),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(tx);
      });

      const response = await request(app)
        .post('/api/habits/habit-1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('complétée');
      expect(response.body).toHaveProperty('rewards');
      expect(response.body).toHaveProperty('streak');
    });

    it('devrait rejeter une double complétion le même jour', async () => {
      const mockHabit = {
        id: 'habit-1',
        userId,
        title: 'Méditation',
        isActive: true,
      };

      const existingLog = {
        id: 'log-1',
        habitId: 'habit-1',
        completedDate: new Date(),
      };

      (prisma.habit.findFirst as jest.Mock).mockResolvedValue(mockHabit);
      (prisma.habitLog.findUnique as jest.Mock).mockResolvedValue(existingLog);

      const response = await request(app)
        .post('/api/habits/habit-1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('déjà complété');
    });

    it('devrait rejeter une habitude inexistante', async () => {
      (prisma.habit.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/habits/nonexistent/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('non trouvée');
    });
  });
});
