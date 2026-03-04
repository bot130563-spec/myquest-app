/**
 * ==========================================
 * 🏆 ROUTES ACHIEVEMENTS
 * ==========================================
 * 
 * Gère les badges et accomplissements du joueur.
 * Les achievements sont débloqués automatiquement selon les critères.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// 📋 DÉFINITION DES ACHIEVEMENTS
// ============================================

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'quests' | 'habits' | 'journal' | 'stats' | 'streak' | 'special';
  xpReward: number;
  condition: (stats: any) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // === QUESTS ===
  {
    id: 'first_quest',
    name: 'Première Quête',
    description: 'Complète ta première quête',
    icon: '⚔️',
    category: 'quests',
    xpReward: 50,
    condition: (s) => s.questsCompleted >= 1
  },
  {
    id: 'quest_hunter',
    name: 'Chasseur de Quêtes',
    description: 'Complète 10 quêtes',
    icon: '🗡️',
    category: 'quests',
    xpReward: 100,
    condition: (s) => s.questsCompleted >= 10
  },
  {
    id: 'quest_master',
    name: 'Maître des Quêtes',
    description: 'Complète 50 quêtes',
    icon: '👑',
    category: 'quests',
    xpReward: 500,
    condition: (s) => s.questsCompleted >= 50
  },
  {
    id: 'epic_slayer',
    name: 'Tueur d\'Épiques',
    description: 'Complète une quête ÉPIQUE',
    icon: '🐉',
    category: 'quests',
    xpReward: 200,
    condition: (s) => s.epicQuestsCompleted >= 1
  },

  // === HABITS ===
  {
    id: 'habit_starter',
    name: 'Bonne Habitude',
    description: 'Crée ta première habitude',
    icon: '🌱',
    category: 'habits',
    xpReward: 25,
    condition: (s) => s.habitsCreated >= 1
  },
  {
    id: 'habit_keeper',
    name: 'Gardien des Habitudes',
    description: 'Maintiens une habitude pendant 7 jours',
    icon: '🔄',
    category: 'habits',
    xpReward: 100,
    condition: (s) => s.bestHabitStreak >= 7
  },
  {
    id: 'habit_master',
    name: 'Maître des Habitudes',
    description: 'Maintiens une habitude pendant 30 jours',
    icon: '💎',
    category: 'habits',
    xpReward: 300,
    condition: (s) => s.bestHabitStreak >= 30
  },

  // === JOURNAL ===
  {
    id: 'first_entry',
    name: 'Première Page',
    description: 'Écris ta première entrée de journal',
    icon: '📝',
    category: 'journal',
    xpReward: 25,
    condition: (s) => s.journalEntries >= 1
  },
  {
    id: 'journal_week',
    name: 'Semaine d\'Introspection',
    description: 'Écris dans ton journal 7 jours de suite',
    icon: '📓',
    category: 'journal',
    xpReward: 100,
    condition: (s) => s.journalStreak >= 7
  },
  {
    id: 'gratitude_guru',
    name: 'Guru de la Gratitude',
    description: 'Écris 100 gratitudes',
    icon: '🙏',
    category: 'journal',
    xpReward: 200,
    condition: (s) => s.totalGratitudes >= 100
  },

  // === STREAKS ===
  {
    id: 'streak_3',
    name: 'Sur la Lancée',
    description: 'Atteins un streak de 3 jours',
    icon: '🔥',
    category: 'streak',
    xpReward: 30,
    condition: (s) => s.currentStreak >= 3
  },
  {
    id: 'streak_7',
    name: 'Semaine Parfaite',
    description: 'Atteins un streak de 7 jours',
    icon: '🔥',
    category: 'streak',
    xpReward: 100,
    condition: (s) => s.currentStreak >= 7
  },
  {
    id: 'streak_30',
    name: 'Mois Légendaire',
    description: 'Atteins un streak de 30 jours',
    icon: '🏆',
    category: 'streak',
    xpReward: 500,
    condition: (s) => s.currentStreak >= 30
  },
  {
    id: 'streak_100',
    name: 'Centurion',
    description: 'Atteins un streak de 100 jours',
    icon: '💯',
    category: 'streak',
    xpReward: 1000,
    condition: (s) => s.currentStreak >= 100
  },

  // === STATS ===
  {
    id: 'balanced',
    name: 'Équilibré',
    description: 'Toutes tes stats sont au-dessus de 50',
    icon: '⚖️',
    category: 'stats',
    xpReward: 150,
    condition: (s) => s.body >= 50 && s.mind >= 50 && s.wisdom >= 50 && s.social >= 50 && s.love >= 50 && s.career >= 50 && s.finance >= 50
  },
  {
    id: 'health_max',
    name: 'Corps de Titan',
    description: 'Atteins 100 en Corps',
    icon: '💪',
    category: 'stats',
    xpReward: 200,
    condition: (s) => s.body >= 100
  },
  {
    id: 'wisdom_max',
    name: 'Sage Érudit',
    description: 'Atteins 100 en Sagesse',
    icon: '📚',
    category: 'stats',
    xpReward: 200,
    condition: (s) => s.wisdom >= 100
  },

  // === SPECIAL ===
  {
    id: 'level_5',
    name: 'Aventurier',
    description: 'Atteins le niveau 5',
    icon: '⭐',
    category: 'special',
    xpReward: 100,
    condition: (s) => s.level >= 5
  },
  {
    id: 'level_10',
    name: 'Héros',
    description: 'Atteins le niveau 10',
    icon: '🌟',
    category: 'special',
    xpReward: 250,
    condition: (s) => s.level >= 10
  },
  {
    id: 'level_25',
    name: 'Champion',
    description: 'Atteins le niveau 25',
    icon: '👑',
    category: 'special',
    xpReward: 500,
    condition: (s) => s.level >= 25
  },
];

// ============================================
// 🎯 GET /achievements - Liste tous les achievements
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Récupérer les achievements débloqués
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId }
    });
    
    const unlockedIds = new Set(userAchievements.map(a => a.achievementId));
    
    // Construire la liste avec status
    const achievements = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt || null
    }));
    
    // Stats
    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    const totalXpEarned = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    
    res.json({
      achievements,
      stats: {
        total: ACHIEVEMENTS.length,
        unlocked: totalUnlocked,
        percentage: Math.round((totalUnlocked / ACHIEVEMENTS.length) * 100),
        totalXpEarned
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des achievements'
    });
  }
});

// ============================================
// 🔍 POST /achievements/check - Vérifie et débloque
// ============================================
router.post('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Récupérer toutes les données nécessaires
    const [user, stats, quests, habits, journalEntries, existingAchievements] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { avatar: true } }),
      prisma.stats.findUnique({ where: { userId } }),
      prisma.quest.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({ where: { userId } }),
      prisma.userAchievement.findMany({ where: { userId } })
    ]);

    if (!stats || !user) {
      return res.status(404).json({ error: 'User data not found' });
    }

    // Calculer les métriques
    const userStats = {
      // Quests
      questsCompleted: quests.filter(q => q.status === 'COMPLETED').length,
      epicQuestsCompleted: quests.filter(q => q.status === 'COMPLETED' && q.difficulty === 'EPIC').length,
      
      // Habits
      habitsCreated: habits.length,
      bestHabitStreak: Math.max(...habits.map(h => h.longestStreak), 0),
      
      // Journal
      journalEntries: journalEntries.length,
      journalStreak: 0, // TODO: calculer le streak journal
      totalGratitudes: journalEntries.reduce((sum, e) => {
        const gratitudes = e.gratitudes as string[] || [];
        return sum + gratitudes.length;
      }, 0),
      
      // Stats
      ...stats,
      
      // Level
      level: user.avatar?.level || 1,
      
      // Global streak
      currentStreak: stats.currentStreak,
    };

    // Vérifier les achievements non débloqués
    const unlockedIds = new Set(existingAchievements.map(a => a.achievementId));
    const newlyUnlocked: typeof ACHIEVEMENTS = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.has(achievement.id) && achievement.condition(userStats)) {
        // Débloquer l'achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        });
        
        // Ajouter XP
        if (user.avatar) {
          await prisma.avatar.update({
            where: { id: user.avatar.id },
            data: {
              experience: { increment: achievement.xpReward }
            }
          });
        }
        
        newlyUnlocked.push(achievement);
      }
    }

    res.json({
      checked: true,
      newlyUnlocked: newlyUnlocked.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xpReward
      })),
      totalUnlocked: unlockedIds.size + newlyUnlocked.length
    });

  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la vérification des achievements'
    });
  }
});

export default router;
