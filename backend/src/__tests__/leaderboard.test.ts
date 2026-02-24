/**
 * Tests pour les routes du leaderboard
 * Teste: GET /api/leaderboard
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

import app from '../index';
import { prisma } from '../config/database';

describe('Leaderboard Routes', () => {
  let authToken: string;
  const userId = 'test-user-2';

  beforeAll(() => {
    authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard', () => {
    it('devrait retourner le top 10 des utilisateurs par XP', async () => {
      const mockUsers = [
        {
          id: 'test-user-1',
          email: 'user1@example.com',
          name: 'Player One',
          avatar: {
            name: 'Hero1',
            level: 5,
            experience: 50,
            avatarType: 'warrior',
          },
        },
        {
          id: 'test-user-2',
          email: 'user2@example.com',
          name: 'Player Two',
          avatar: {
            name: 'Hero2',
            level: 3,
            experience: 25,
            avatarType: 'mage',
          },
        },
        {
          id: 'test-user-3',
          email: 'user3@example.com',
          name: 'Player Three',
          avatar: {
            name: 'Hero3',
            level: 2,
            experience: 10,
            avatarType: 'rogue',
          },
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('leaderboard');
      expect(response.body).toHaveProperty('currentUser');

      // Vérifie que le leaderboard est trié par totalXp (décroissant)
      const leaderboard = response.body.leaderboard;
      expect(leaderboard).toHaveLength(3);

      // Le premier devrait être le joueur avec le plus d'XP
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].level).toBe(5);

      // Le deuxième
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[1].level).toBe(3);

      // Le troisième
      expect(leaderboard[2].rank).toBe(3);
      expect(leaderboard[2].level).toBe(2);

      // Vérifie que l'utilisateur actuel est marqué
      const currentUser = leaderboard.find((u: any) => u.isCurrentUser);
      expect(currentUser).toBeDefined();
      expect(currentUser.userId).toBe(userId);
    });

    it('devrait limiter le leaderboard à 10 utilisateurs maximum', async () => {
      // Crée 15 utilisateurs mock
      const mockUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        name: `Player ${i}`,
        avatar: {
          name: `Hero${i}`,
          level: 15 - i, // Niveaux décroissants
          experience: 50,
          avatarType: 'warrior',
        },
      }));

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.leaderboard.length).toBeLessThanOrEqual(10);
    });

    it('devrait gérer le cas où il n\'y a pas d\'avatar', async () => {
      const mockUsers = [
        {
          id: 'user-no-avatar',
          email: 'noavatar@example.com',
          name: 'No Avatar User',
          avatar: null,
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.leaderboard).toHaveLength(1);
      expect(response.body.leaderboard[0].avatarName).toBe('Hero');
      expect(response.body.leaderboard[0].level).toBe(1);
      expect(response.body.leaderboard[0].totalXp).toBe(0);
    });

    it('devrait calculer correctement le total XP', async () => {
      const mockUsers = [
        {
          id: 'test-user-1',
          email: 'user1@example.com',
          name: 'Player One',
          avatar: {
            name: 'Hero1',
            level: 3, // Level 1->2: 100 XP, Level 2->3: 200 XP = 300 XP total précédent
            experience: 50, // + 50 XP actuel = 350 XP total
            avatarType: 'warrior',
          },
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Calcul attendu: ((3-1) * 3 * 100) / 2 + 50 = (2 * 3 * 100) / 2 + 50 = 300 + 50 = 350
      expect(response.body.leaderboard[0].totalXp).toBe(350);
    });

    it('devrait fournir le rang de l\'utilisateur actuel', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'Player One',
          avatar: { name: 'Hero1', level: 5, experience: 50, avatarType: 'warrior' },
        },
        {
          id: userId,
          email: 'user2@example.com',
          name: 'Current User',
          avatar: { name: 'Hero2', level: 3, experience: 25, avatarType: 'mage' },
        },
        {
          id: 'user-3',
          email: 'user3@example.com',
          name: 'Player Three',
          avatar: { name: 'Hero3', level: 2, experience: 10, avatarType: 'rogue' },
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.currentUser.rank).toBe(2); // 2ème sur 3
      expect(response.body.currentUser.totalUsers).toBe(3);
    });

    it('devrait rejeter les requêtes sans authentification', async () => {
      const response = await request(app).get('/api/leaderboard');

      expect(response.status).toBe(401);
    });
  });
});
