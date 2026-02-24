/**
 * Tests pour les routes d'authentification
 * Teste: POST /api/auth/register, POST /api/auth/login
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma et connectDatabase
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock de l'app Express
import app from '../index';
import { prisma } from '../config/database';

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('devrait créer un nouveau compte avec succès', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: {
          id: 'avatar-123',
          userId: 'user-123',
          name: 'Hero',
          level: 1,
          experience: 0,
          avatarType: 'warrior',
          appearance: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        stats: {
          id: 'stats-123',
          userId: 'user-123',
          health: 50,
          energy: 50,
          wisdom: 50,
          social: 50,
          wealth: 50,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.message).toContain('Bienvenue');
    });

    it('devrait rejeter un email déjà existant', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('existe déjà');
    });

    it('devrait rejeter des données invalides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Trop court
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: {
          name: 'Hero',
          level: 1,
          experience: 0,
          avatarType: 'warrior',
        },
        stats: {
          health: 50,
          energy: 50,
          wisdom: 50,
          social: 50,
          wealth: 50,
          currentStreak: 0,
          longestStreak: 0,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('devrait rejeter un email inexistant', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('incorrect');
    });

    it('devrait rejeter un mot de passe incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 12),
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('incorrect');
    });
  });
});
