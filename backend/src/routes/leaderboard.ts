/**
 * ==========================================
 * 🏆 ROUTES LEADERBOARD - Classement
 * ==========================================
 *
 * ENDPOINTS:
 * - GET /api/leaderboard → Top 10 utilisateurs par XP total
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ============================================
// 🏆 GET /leaderboard - Top 10 utilisateurs
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    // Calcul du total XP = level * 100 + experience actuel
    // Car chaque level = 100 XP
    const users = await prisma.user.findMany({
      include: {
        avatar: {
          select: {
            name: true,
            level: true,
            experience: true,
            avatarType: true,
          },
        },
      },
    });

    // Calculer le total XP pour chaque utilisateur
    const leaderboard = users
      .map(user => {
        const avatar = user.avatar;
        if (!avatar) {
          return {
            userId: user.id,
            username: user.name || user.email.split('@')[0],
            avatarName: 'Hero',
            avatarType: 'warrior',
            level: 1,
            totalXp: 0,
          };
        }

        // Total XP = XP de tous les niveaux précédents + XP actuel
        const previousLevelsXp = ((avatar.level - 1) * avatar.level * 100) / 2; // Somme 100+200+...
        const totalXp = previousLevelsXp + avatar.experience;

        return {
          userId: user.id,
          username: user.name || user.email.split('@')[0],
          avatarName: avatar.name,
          avatarType: avatar.avatarType,
          level: avatar.level,
          currentXp: avatar.experience,
          totalXp: Math.round(totalXp),
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        isCurrentUser: entry.userId === req.userId,
      }));

    // Trouver le rang de l'utilisateur actuel
    const allRanked = users
      .map(user => {
        const avatar = user.avatar;
        if (!avatar) return { userId: user.id, totalXp: 0 };
        const previousLevelsXp = ((avatar.level - 1) * avatar.level * 100) / 2;
        return {
          userId: user.id,
          totalXp: Math.round(previousLevelsXp + avatar.experience),
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp);

    const currentUserRank = allRanked.findIndex(u => u.userId === req.userId) + 1;

    res.json({
      leaderboard,
      currentUser: {
        rank: currentUserRank,
        totalUsers: users.length,
      },
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération du leaderboard',
    });
  }
});

export default router;
