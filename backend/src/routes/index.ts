/**
 * ==========================================
 * 🛤️ MYQUEST API - DÉFINITION DES ROUTES
 * ==========================================
 * 
 * Ce fichier définit toutes les routes de l'API.
 * Chaque route correspond à une action utilisateur.
 * 
 * ORGANISATION:
 * - /api              → Info générale sur l'API
 * - /api/auth/*       → Authentification (login, register)
 * - /api/user/*       → Données utilisateur (profil, avatar, stats)
 * - /api/quests/*     → Gestion des quêtes (à venir)
 * 
 * STATUTS HTTP UTILISÉS:
 * - 200 OK           → Succès
 * - 201 Created      → Ressource créée
 * - 400 Bad Request  → Erreur dans les données envoyées
 * - 401 Unauthorized → Non authentifié
 * - 404 Not Found    → Ressource inexistante
 * - 501 Not Implemented → Fonctionnalité pas encore codée
 */

import { Router, Request, Response } from 'express';

// Crée un "mini-app" router qu'on attache à /api dans index.ts
const router = Router();

// ============================================
// 📋 ROUTE RACINE API - Documentation des endpoints
// ============================================
// GET /api
// Retourne la liste de tous les endpoints disponibles
// Utile pour les développeurs qui découvrent l'API
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to MyQuest API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',  // Créer un compte
        login: 'POST /api/auth/login'          // Se connecter
      },
      user: {
        profile: 'GET /api/user/profile',      // Récupérer son profil
        avatar: 'GET /api/user/avatar',        // Récupérer son avatar
        stats: 'GET /api/user/stats'           // Récupérer ses stats
      }
    }
  });
});

// ============================================
// 🔐 ROUTES AUTH - Authentification
// ============================================

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 * 
 * Body attendu:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse123",
 *   "name": "Jean Dupont"  // optionnel
 * }
 * 
 * Réponse (à implémenter):
 * {
 *   "user": { id, email, name },
 *   "token": "jwt.token.here"
 * }
 */
router.post('/auth/register', (_req: Request, res: Response) => {
  // TODO: Implémenter l'inscription
  // 1. Valider les données (zod)
  // 2. Vérifier que l'email n'existe pas
  // 3. Hasher le mot de passe (bcrypt)
  // 4. Créer l'utilisateur en DB (Prisma)
  // 5. Créer l'avatar et stats par défaut
  // 6. Générer un JWT
  // 7. Retourner user + token
  res.status(501).json({ message: 'Registration - Coming soon' });
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur existant
 * 
 * Body attendu:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse123"
 * }
 * 
 * Réponse (à implémenter):
 * {
 *   "user": { id, email, name },
 *   "token": "jwt.token.here"
 * }
 */
router.post('/auth/login', (_req: Request, res: Response) => {
  // TODO: Implémenter le login
  // 1. Valider les données
  // 2. Chercher l'utilisateur par email
  // 3. Vérifier le mot de passe (bcrypt.compare)
  // 4. Générer un JWT
  // 5. Retourner user + token
  res.status(501).json({ message: 'Login - Coming soon' });
});

// ============================================
// 👤 ROUTES USER - Données utilisateur
// ============================================
// Ces routes nécessiteront un middleware d'auth (JWT)

/**
 * GET /api/user/profile
 * Récupère le profil de l'utilisateur connecté
 * 
 * Headers requis:
 * Authorization: Bearer <jwt-token>
 * 
 * Réponse:
 * {
 *   "id": "abc123",
 *   "email": "user@example.com",
 *   "name": "Jean Dupont",
 *   "createdAt": "2024-01-01T00:00:00Z"
 * }
 */
router.get('/user/profile', (_req: Request, res: Response) => {
  // TODO: Implémenter
  // 1. Vérifier le JWT (middleware)
  // 2. Récupérer l'user depuis req.userId
  // 3. Retourner les données (sans mot de passe!)
  res.status(501).json({ message: 'Profile - Coming soon' });
});

/**
 * GET /api/user/avatar
 * Récupère l'avatar et niveau de l'utilisateur
 * 
 * Réponse:
 * {
 *   "name": "Hero",
 *   "level": 5,
 *   "experience": 450,
 *   "avatarType": "warrior",
 *   "appearance": { hair: "black", skin: "medium" }
 * }
 */
router.get('/user/avatar', (_req: Request, res: Response) => {
  // TODO: Implémenter
  // L'avatar évolue quand l'utilisateur gagne de l'XP
  res.status(501).json({ message: 'Avatar - Coming soon' });
});

/**
 * GET /api/user/stats
 * Récupère les statistiques de vie de l'utilisateur
 * 
 * Réponse:
 * {
 *   "health": 75,      // Santé physique (0-100)
 *   "energy": 60,      // Énergie mentale (0-100)
 *   "wisdom": 45,      // Connaissances (0-100)
 *   "social": 80,      // Relations (0-100)
 *   "wealth": 55,      // Finances (0-100)
 *   "currentStreak": 7,
 *   "longestStreak": 14
 * }
 */
router.get('/user/stats', (_req: Request, res: Response) => {
  // TODO: Implémenter
  // Les stats changent quand l'utilisateur complète des quêtes
  res.status(501).json({ message: 'Stats - Coming soon' });
});

// Export du router pour l'utiliser dans index.ts
export default router;
