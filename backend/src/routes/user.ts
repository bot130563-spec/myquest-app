/**
 * ==========================================
 * 👤 ROUTES USER - Données Utilisateur
 * ==========================================
 * 
 * Routes protégées pour accéder aux données de l'utilisateur.
 * Toutes ces routes nécessitent un token JWT valide.
 * 
 * ENDPOINTS:
 * - GET  /api/user/profile → Profil complet
 * - GET  /api/user/avatar  → Avatar et niveau
 * - PUT  /api/user/avatar  → Modifier l'avatar
 * - GET  /api/user/stats   → Statistiques de vie
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ============================================
// 🛡️ TOUTES LES ROUTES SONT PROTÉGÉES
// ============================================
// authMiddleware s'applique à TOUTES les routes de ce fichier
router.use(authMiddleware);

// ============================================
// 👤 GET /user/profile - Profil complet
// ============================================
/**
 * Récupère le profil complet de l'utilisateur connecté.
 * Inclut l'avatar et les stats.
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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
    
    // Retourne tout sauf le mot de passe
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar,
      stats: user.stats,
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération du profil',
    });
  }
});

// ============================================
// 🦸 GET /user/avatar - Avatar actuel
// ============================================
/**
 * Récupère uniquement l'avatar de l'utilisateur.
 * Utile pour afficher le niveau/XP sans charger tout le profil.
 */
router.get('/avatar', async (req: Request, res: Response) => {
  try {
    const avatar = await prisma.avatar.findUnique({
      where: { userId: req.userId },
    });
    
    if (!avatar) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Avatar non trouvé',
      });
      return;
    }
    
    // Calcule l'XP nécessaire pour le prochain niveau
    // Formule simple: niveau * 100 XP
    const xpForNextLevel = avatar.level * 100;
    const xpProgress = Math.round((avatar.experience / xpForNextLevel) * 100);
    
    res.json({
      ...avatar,
      // Infos calculées supplémentaires
      xpForNextLevel,
      xpProgress,  // Pourcentage de progression vers le niveau suivant
    });
    
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: "Erreur lors de la récupération de l'avatar",
    });
  }
});

// ============================================
// ✏️ PUT /user/avatar - Modifier l'avatar
// ============================================
/**
 * Modifie l'avatar de l'utilisateur (nom, type, apparence).
 * 
 * Body (tous optionnels):
 * {
 *   "name": "Nouveau Nom",
 *   "avatarType": "mage",
 *   "appearance": { "hair": "blond", "skin": "light" }
 * }
 */
router.put('/avatar', async (req: Request, res: Response) => {
  try {
    const { name, avatarType, appearance } = req.body;
    
    // Construit l'objet de mise à jour (seulement les champs fournis)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (avatarType !== undefined) updateData.avatarType = avatarType;
    if (appearance !== undefined) updateData.appearance = appearance;
    
    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Aucune donnée à mettre à jour',
      });
      return;
    }
    
    const avatar = await prisma.avatar.update({
      where: { userId: req.userId },
      data: updateData,
    });
    
    res.json({
      message: 'Avatar mis à jour! 🎨',
      avatar,
    });
    
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: "Erreur lors de la mise à jour de l'avatar",
    });
  }
});

// ============================================
// 📊 GET /user/stats - Statistiques
// ============================================
/**
 * Récupère les statistiques de vie de l'utilisateur.
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await prisma.stats.findUnique({
      where: { userId: req.userId },
    });
    
    if (!stats) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Stats non trouvées',
      });
      return;
    }
    
    // Calcule la moyenne des stats (indicateur global — 7 dimensions)
    const coreStats = [stats.body, stats.mind, stats.wisdom, stats.social, stats.love, stats.career, stats.finance];
    const averageScore = Math.round(coreStats.reduce((a, b) => a + b, 0) / coreStats.length);

    res.json({
      ...stats,
      // Score global calculé
      averageScore,
      // Labels pour le frontend (7 dimensions)
      labels: {
        body: '💪 Corps',
        mind: '🧠 Esprit',
        wisdom: '📚 Sagesse',
        social: '👥 Social',
        love: '❤️ Amour',
        career: '🎯 Carrière',
        finance: '💰 Finances',
      },
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des stats',
    });
  }
});

export default router;
