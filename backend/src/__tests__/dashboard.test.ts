/**
 * Tests pour les routes du tableau de bord
 * Teste: GET /api/dashboard/weekly-summary, GET /api/dashboard/daily-progress
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    quest: {
      count: jest.fn(),
    },
    habitLog: {
      count: jest.fn(),
    },
    habit: {
      findMany: jest.fn(),
    },
    journalEntry: {
      count: jest.fn(),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

import app from '../index';
import { prisma } from '../config/database';

describe('Dashboard Routes', () => {
  let authToken: string;
  const userId = 'test-user-123';

  beforeAll(() => {
    authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/weekly-summary', () => {
    it('devrait retourner le résumé de la semaine', async () => {
      // Mock des données
      (prisma.quest.count as jest.Mock).mockResolvedValue(3);
      (prisma.habitLog.count as jest.Mock).mockResolvedValue(15);
      (prisma.journalEntry.count as jest.Mock).mockResolvedValue(5);
      (prisma.habit.findMany as jest.Mock).mockResolvedValue([
        { streakCount: 5 },
        { streakCount: 7 },
        { streakCount: 3 },
      ]);

      const response = await request(app)
        .get('/api/dashboard/weekly-summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period', 'last7days');
      expect(response.body).toHaveProperty('questsCompleted', 3);
      expect(response.body).toHaveProperty('habitCompletions', 15);
      expect(response.body).toHaveProperty('journalEntries', 5);
      expect(response.body).toHaveProperty('xpEarned');
      expect(response.body).toHaveProperty('habitsAverageStreak');

      // Vérifie le calcul du streak moyen : (5+7+3)/3 = 5
      expect(response.body.habitsAverageStreak).toBe(5);

      // Vérifie le calcul de l'XP : (3 * 25) + (15 * 10) = 225
      expect(response.body.xpEarned).toBe(225);
    });

    it('devrait gérer le cas où il n\'y a pas d\'habitudes', async () => {
      (prisma.quest.count as jest.Mock).mockResolvedValue(0);
      (prisma.habitLog.count as jest.Mock).mockResolvedValue(0);
      (prisma.journalEntry.count as jest.Mock).mockResolvedValue(0);
      (prisma.habit.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/weekly-summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.habitsAverageStreak).toBe(0);
      expect(response.body.xpEarned).toBe(0);
    });

    it('devrait rejeter les requêtes sans authentification', async () => {
      const response = await request(app).get('/api/dashboard/weekly-summary');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/daily-progress', () => {
    it('devrait retourner la progression du jour', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockHabits = [
        {
          id: 'habit-1',
          frequency: 'DAILY',
          targetDays: [],
          logs: [{ completedDate: today }], // Complétée
        },
        {
          id: 'habit-2',
          frequency: 'DAILY',
          targetDays: [],
          logs: [], // Non complétée
        },
        {
          id: 'habit-3',
          frequency: 'DAILY',
          targetDays: [],
          logs: [{ completedDate: today }], // Complétée
        },
      ];

      (prisma.habit.findMany as jest.Mock).mockResolvedValue(mockHabits);

      const response = await request(app)
        .get('/api/dashboard/daily-progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('goal', 3);
      expect(response.body).toHaveProperty('completed', 2);
      expect(response.body).toHaveProperty('remaining', 1);
      expect(response.body).toHaveProperty('percentage');

      // Vérifie le calcul du pourcentage : 2/3 = 66.67% arrondi à 67%
      expect(response.body.percentage).toBe(67);
      expect(response.body).toHaveProperty('message');
    });

    it('devrait gérer le cas où toutes les habitudes sont complétées', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockHabits = [
        {
          id: 'habit-1',
          frequency: 'DAILY',
          targetDays: [],
          logs: [{ completedDate: today }],
        },
        {
          id: 'habit-2',
          frequency: 'DAILY',
          targetDays: [],
          logs: [{ completedDate: today }],
        },
      ];

      (prisma.habit.findMany as jest.Mock).mockResolvedValue(mockHabits);

      const response = await request(app)
        .get('/api/dashboard/daily-progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.percentage).toBe(100);
      expect(response.body.message).toContain('complétées');
    });

    it('devrait gérer le cas où il n\'y a pas d\'habitudes pour aujourd\'hui', async () => {
      (prisma.habit.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/daily-progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goal).toBe(0);
      expect(response.body.completed).toBe(0);
      expect(response.body.percentage).toBe(100);
    });

    it('devrait rejeter les requêtes sans authentification', async () => {
      const response = await request(app).get('/api/dashboard/daily-progress');

      expect(response.status).toBe(401);
    });
  });
});
