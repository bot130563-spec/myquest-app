/**
 * ==========================================
 * 🛤️ ROUTES INDEX - Point d'entrée des routes
 * ==========================================
 * 
 * Centralise toutes les routes de l'API.
 * Chaque groupe de routes est dans son propre fichier.
 * 
 * STRUCTURE:
 * /api
 * ├── /auth    → Authentification (auth.ts)
 * │   ├── POST /register
 * │   ├── POST /login
 * │   └── GET  /me
 * │
 * └── /user    → Données utilisateur (user.ts)
 *     ├── GET  /profile
 *     ├── GET  /avatar
 *     ├── PUT  /avatar
 *     └── GET  /stats
 */

import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import questRoutes from './quest';
import habitRoutes from './habit';
import journalRoutes from './journal';
import dashboardRoutes from './dashboard';
import coachRoutes from './coach';

const router = Router();

// ============================================
// 📋 GET /api - Documentation des endpoints
// ============================================
/**
 * Route racine de l'API.
 * Retourne la liste de tous les endpoints disponibles.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Bienvenue sur l\'API MyQuest! 🎮',
    version: '1.0.0',
    documentation: {
      // Routes publiques (pas de token requis)
      public: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'Vérifie que le serveur est en ligne',
        },
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Créer un nouveau compte',
          body: {
            email: 'string (requis)',
            password: 'string (requis, min 8 chars)',
            name: 'string (optionnel)',
            avatarName: 'string (optionnel)',
          },
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Se connecter',
          body: {
            email: 'string (requis)',
            password: 'string (requis)',
          },
        },
      },
      
      // Routes protégées (token JWT requis)
      protected: {
        note: 'Ces routes nécessitent le header: Authorization: Bearer <token>',
        me: {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Récupérer l\'utilisateur connecté',
        },
        profile: {
          method: 'GET',
          path: '/api/user/profile',
          description: 'Récupérer le profil complet',
        },
        avatar: {
          get: {
            method: 'GET',
            path: '/api/user/avatar',
            description: 'Récupérer l\'avatar',
          },
          update: {
            method: 'PUT',
            path: '/api/user/avatar',
            description: 'Modifier l\'avatar',
            body: {
              name: 'string (optionnel)',
              avatarType: 'string (optionnel)',
              appearance: 'object (optionnel)',
            },
          },
        },
        stats: {
          method: 'GET',
          path: '/api/user/stats',
          description: 'Récupérer les statistiques',
        },
      },
    },
  });
});

// ============================================
// 🔗 MONTAGE DES ROUTES
// ============================================

// Routes d'authentification: /api/auth/*
router.use('/auth', authRoutes);

// Routes utilisateur: /api/user/*
router.use('/user', userRoutes);

// Routes quêtes: /api/quests/*
router.use('/quests', questRoutes);

// Routes habitudes: /api/habits/*
router.use('/habits', habitRoutes);

// Routes journal: /api/journal/*
router.use('/journal', journalRoutes);

// Routes dashboard: /api/dashboard
router.use('/dashboard', dashboardRoutes);

// Routes coach IA: /api/coach/*
router.use('/coach', coachRoutes);

export default router;
