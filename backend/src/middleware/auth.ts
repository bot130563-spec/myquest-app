/**
 * ==========================================
 * 🔐 MIDDLEWARE D'AUTHENTIFICATION
 * ==========================================
 * 
 * Vérifie le token JWT dans les requêtes protégées.
 * Ajoute l'userId à la requête si le token est valide.
 * 
 * USAGE:
 * router.get('/profile', authMiddleware, (req, res) => {
 *   const userId = req.userId; // Disponible après auth
 * });
 * 
 * Le client doit envoyer le header:
 * Authorization: Bearer <token>
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// ============================================
// 📝 EXTENSION DU TYPE REQUEST
// ============================================
// Ajoute userId au type Request de Express
// Permet d'accéder à req.userId sans erreur TypeScript

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        userId: string;
      };
    }
  }
}

// ============================================
// 🎫 INTERFACE DU PAYLOAD JWT
// ============================================
// Structure des données encodées dans le token

interface JwtPayload {
  userId: string;  // ID de l'utilisateur
  iat: number;     // Issued At (timestamp création)
  exp: number;     // Expiration (timestamp)
}

// ============================================
// 🛡️ MIDDLEWARE PRINCIPAL
// ============================================

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // ── ÉTAPE 1: Récupérer le header Authorization ──
    const authHeader = req.headers.authorization;
    
    // Vérifie que le header existe et commence par "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token manquant. Connectez-vous pour accéder à cette ressource.',
      });
      return;
    }
    
    // ── ÉTAPE 2: Extraire le token ──
    // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    // On prend tout après "Bearer "
    const token = authHeader.substring(7);
    
    // ── ÉTAPE 3: Vérifier et décoder le token ──
    // jwt.verify() fait 3 choses:
    // 1. Vérifie la signature (pas falsifié)
    // 2. Vérifie l'expiration (pas expiré)
    // 3. Décode le payload
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // ── ÉTAPE 4: Ajouter userId à la requête ──
    // Les routes suivantes peuvent utiliser req.userId ou req.user
    req.userId = decoded.userId;
    req.user = { userId: decoded.userId };

    // ── ÉTAPE 5: Passer au middleware/route suivant ──
    next();
    
  } catch (error) {
    // ── GESTION DES ERREURS JWT ──
    
    if (error instanceof jwt.TokenExpiredError) {
      // Token valide mais expiré
      res.status(401).json({
        error: 'Token Expired',
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      // Token invalide (malformé, mauvaise signature)
      res.status(401).json({
        error: 'Invalid Token',
        message: 'Token invalide. Veuillez vous reconnecter.',
      });
      return;
    }
    
    // Erreur inattendue
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la vérification du token.',
    });
  }
}

// ============================================
// 🎫 FONCTION UTILITAIRE: GÉNÉRER UN TOKEN
// ============================================

/**
 * Génère un JWT pour un utilisateur
 * @param userId - ID de l'utilisateur à encoder
 * @returns Token JWT signé
 */
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },           // Payload (données encodées)
    config.jwt.secret,    // Clé secrète
    { expiresIn: '7d' }   // Durée de vie: 7 jours
  );
}

// Alias pour compatibilité
export const authenticateToken = authMiddleware;
