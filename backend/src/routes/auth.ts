/**
 * ==========================================
 * 🔐 ROUTES AUTH - Authentification
 * ==========================================
 * 
 * Gère l'inscription et la connexion des utilisateurs.
 * 
 * ENDPOINTS:
 * - POST /api/auth/register → Créer un compte
 * - POST /api/auth/login    → Se connecter
 * - GET  /api/auth/me       → Récupérer l'utilisateur connecté
 * 
 * SÉCURITÉ:
 * - Mots de passe hashés avec bcrypt (jamais stockés en clair)
 * - Tokens JWT pour l'authentification
 * - Validation des entrées avec Zod
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken, authMiddleware } from '../middleware/auth';
import { registerSchema, loginSchema, validate } from '../validators/auth';

const router = Router();

// ============================================
// 📝 POST /auth/register - Inscription
// ============================================
/**
 * Crée un nouveau compte utilisateur.
 * Crée aussi automatiquement l'avatar et les stats par défaut.
 * 
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse123",
 *   "name": "Jean Dupont",      // optionnel
 *   "avatarName": "SuperHero"   // optionnel
 * }
 * 
 * Réponse (201):
 * {
 *   "message": "Compte créé avec succès",
 *   "user": { id, email, name, createdAt },
 *   "token": "jwt.token.here"
 * }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // ── ÉTAPE 1: Valider les données entrantes ──
    const validation = validate(registerSchema, req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: validation.errors,
      });
      return;
    }
    
    const { email, password, name, avatarName } = validation.data;
    
    // ── ÉTAPE 2: Vérifier que l'email n'existe pas déjà ──
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Un compte existe déjà avec cet email',
      });
      return;
    }
    
    // ── ÉTAPE 3: Hasher le mot de passe ──
    // bcrypt.hash() avec saltRounds = 12 (bon compromis sécurité/perf)
    // Le hash inclut le salt, donc on stocke juste le hash
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // ── ÉTAPE 4: Créer l'utilisateur + avatar + stats ──
    // Transaction implicite: tout est créé ensemble ou rien
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        // Crée l'avatar lié automatiquement
        avatar: {
          create: {
            name: avatarName || 'Hero',  // Nom par défaut si non fourni
            level: 1,
            experience: 0,
            avatarType: 'warrior',
          },
        },
        // Crée les stats liées automatiquement
        stats: {
          create: {
            body: 50,
            mind: 50,
            wisdom: 50,
            social: 50,
            love: 50,
            career: 50,
            finance: 50,
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
      // Inclut l'avatar et stats dans la réponse
      include: {
        avatar: true,
        stats: true,
      },
    });
    
    // ── ÉTAPE 5: Générer le token JWT ──
    const token = generateToken(user.id);
    
    // ── ÉTAPE 6: Retourner la réponse (sans le mot de passe!) ──
    res.status(201).json({
      message: 'Compte créé avec succès! Bienvenue dans MyQuest 🎮',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        avatar: user.avatar,
        stats: user.stats,
      },
      token,
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: "Erreur lors de la création du compte",
    });
  }
});

// ============================================
// 🔑 POST /auth/login - Connexion
// ============================================
/**
 * Connecte un utilisateur existant.
 * 
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse123"
 * }
 * 
 * Réponse (200):
 * {
 *   "message": "Connexion réussie",
 *   "user": { id, email, name, avatar, stats },
 *   "token": "jwt.token.here"
 * }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // ── ÉTAPE 1: Valider les données ──
    const validation = validate(loginSchema, req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: validation.errors,
      });
      return;
    }
    
    const { email, password } = validation.data;
    
    // ── ÉTAPE 2: Chercher l'utilisateur par email ──
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        avatar: true,
        stats: true,
      },
    });
    
    // Si pas trouvé, message générique (sécurité: ne pas révéler si l'email existe)
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }
    
    // ── ÉTAPE 3: Vérifier le mot de passe ──
    // bcrypt.compare() compare le mot de passe en clair avec le hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }
    
    // ── ÉTAPE 4: Générer le token ──
    const token = generateToken(user.id);
    
    // ── ÉTAPE 5: Retourner la réponse ──
    res.status(200).json({
      message: `Bon retour, ${user.avatar?.name || 'Hero'}! 🎮`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        avatar: user.avatar,
        stats: user.stats,
      },
      token,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la connexion',
    });
  }
});

// ============================================
// 👤 GET /auth/me - Utilisateur connecté
// ============================================
/**
 * Récupère les informations de l'utilisateur actuellement connecté.
 * Nécessite un token valide.
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Réponse (200):
 * {
 *   "user": { id, email, name, avatar, stats }
 * }
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    // userId est ajouté par authMiddleware
    const userId = req.userId;
    
    // Récupère l'utilisateur avec ses relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        avatar: true,
        stats: true,
      },
    });
    
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Utilisateur non trouvé',
      });
      return;
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
    
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération du profil',
    });
  }
});

export default router;
