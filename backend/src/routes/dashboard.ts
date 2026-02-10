/**
 * ==========================================
 * 📊 ROUTES DASHBOARD - Vue d'ensemble
 * ==========================================
 * 
 * Agrège toutes les données pour le tableau de bord.
 * 
 * ENDPOINTS:
 * - GET /api/dashboard → Résumé complet
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { moodEmojis } from '../validators/journal';
import { shouldDoToday } from '../validators/habit';

const router = Router();
router.use(authMiddleware);

// ============================================
// 📊 GET /dashboard - Vue d'ensemble
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ── 1. DONNÉES UTILISATEUR ──
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        avatar: true,
        stats: true,
      },
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // ── 2. QUÊTES ──
    const questCounts = await prisma.quest.groupBy({
      by: ['status'],
      where: { userId: req.userId },
      _count: true,
    });
    
    const activeQuests = await prisma.quest.findMany({
      where: {
        userId: req.userId,
        status: 'ACTIVE',
      },
      orderBy: { dueDate: 'asc' },
      take: 3,
    });
    
    // ── 3. HABITUDES DU JOUR ──
    const allHabits = await prisma.habit.findMany({
      where: {
        userId: req.userId,
        isActive: true,
      },
      include: {
        logs: {
          where: { completedDate: today },
        },
      },
    });
    
    const todayHabits = allHabits.filter(h => 
      shouldDoToday(h.frequency, h.targetDays as number[])
    );
    
    const habitsCompleted = todayHabits.filter(h => h.logs.length > 0).length;
    const habitsTotal = todayHabits.length;
    
    // ── 4. JOURNAL ──
    const todayJournal = await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: req.userId!,
          entryDate: today,
        },
      },
    });
    
    // Streak d'écriture
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: req.userId },
      select: { entryDate: true },
      orderBy: { entryDate: 'desc' },
      take: 30,
    });
    
    let journalStreak = 0;
    for (let i = 0; i < journalEntries.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      const entryDate = new Date(journalEntries[i].entryDate);
      entryDate.setHours(0, 0, 0, 0);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        journalStreak++;
      } else {
        break;
      }
    }
    
    // ── 5. ACTIVITÉ RÉCENTE (7 jours) ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentQuests = await prisma.quest.count({
      where: {
        userId: req.userId,
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
      },
    });
    
    const recentHabitLogs = await prisma.habitLog.count({
      where: {
        habit: { userId: req.userId },
        completedAt: { gte: sevenDaysAgo },
      },
    });
    
    // ── 6. XP & NIVEAU ──
    const avatar = user.avatar;
    const xpForNextLevel = (avatar?.level || 1) * 100;
    const xpProgress = avatar 
      ? Math.round((avatar.experience / xpForNextLevel) * 100) 
      : 0;
    
    // ── 7. CALCUL SCORE GLOBAL ──
    const stats = user.stats;
    const coreStats = stats 
      ? [stats.health, stats.energy, stats.wisdom, stats.social, stats.wealth]
      : [50, 50, 50, 50, 50];
    const globalScore = Math.round(coreStats.reduce((a, b) => a + b, 0) / 5);
    
    // ── RÉPONSE ──
    res.json({
      // Profil
      user: {
        name: user.name,
        email: user.email,
      },
      
      // Avatar & Niveau
      avatar: {
        name: avatar?.name || 'Hero',
        level: avatar?.level || 1,
        experience: avatar?.experience || 0,
        xpForNextLevel,
        xpProgress,
        avatarType: avatar?.avatarType || 'warrior',
      },
      
      // Stats
      stats: {
        health: stats?.health || 50,
        energy: stats?.energy || 50,
        wisdom: stats?.wisdom || 50,
        social: stats?.social || 50,
        wealth: stats?.wealth || 50,
        globalScore,
        currentStreak: stats?.currentStreak || 0,
        longestStreak: stats?.longestStreak || 0,
      },
      
      // Quêtes
      quests: {
        active: questCounts.find(q => q.status === 'ACTIVE')?._count || 0,
        completed: questCounts.find(q => q.status === 'COMPLETED')?._count || 0,
        total: questCounts.reduce((sum, q) => sum + q._count, 0),
        upcoming: activeQuests.map(q => ({
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          xpReward: q.xpReward,
          dueDate: q.dueDate,
        })),
      },
      
      // Habitudes du jour
      habits: {
        completed: habitsCompleted,
        total: habitsTotal,
        percentage: habitsTotal > 0 
          ? Math.round((habitsCompleted / habitsTotal) * 100) 
          : 100,
        remaining: todayHabits
          .filter(h => h.logs.length === 0)
          .map(h => ({
            id: h.id,
            title: h.title,
            icon: h.icon,
            currentStreak: h.currentStreak,
          })),
      },
      
      // Journal
      journal: {
        writtenToday: !!todayJournal,
        todayMood: todayJournal?.mood || null,
        todayMoodEmoji: todayJournal ? moodEmojis[todayJournal.mood] : null,
        streak: journalStreak,
      },
      
      // Activité récente (7 jours)
      recentActivity: {
        questsCompleted: recentQuests,
        habitsCompleted: recentHabitLogs,
        totalXpEstimate: (recentQuests * 25) + (recentHabitLogs * 10),
      },
      
      // Conseils du jour
      tips: generateTips({
        habitsCompleted,
        habitsTotal,
        journalWritten: !!todayJournal,
        activeQuests: activeQuests.length,
        globalScore,
      }),
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors du chargement du dashboard',
    });
  }
});

// ============================================
// 🎯 GÉNÉRATION DE CONSEILS
// ============================================

interface TipsInput {
  habitsCompleted: number;
  habitsTotal: number;
  journalWritten: boolean;
  activeQuests: number;
  globalScore: number;
}

function generateTips(data: TipsInput): string[] {
  const tips: string[] = [];
  
  // Habitudes
  if (data.habitsTotal > 0 && data.habitsCompleted < data.habitsTotal) {
    const remaining = data.habitsTotal - data.habitsCompleted;
    tips.push(`🔄 Il te reste ${remaining} habitude${remaining > 1 ? 's' : ''} à faire aujourd'hui!`);
  } else if (data.habitsCompleted === data.habitsTotal && data.habitsTotal > 0) {
    tips.push('✅ Toutes tes habitudes du jour sont faites! Bravo!');
  }
  
  // Journal
  if (!data.journalWritten) {
    tips.push('📓 Prends 5 minutes pour écrire dans ton journal.');
  }
  
  // Quêtes
  if (data.activeQuests === 0) {
    tips.push('⚔️ Tu n\'as pas de quête en cours. Crée-en une!');
  }
  
  // Score global
  if (data.globalScore < 40) {
    tips.push('💪 Ton score global est bas. Focus sur une stat à améliorer!');
  } else if (data.globalScore >= 70) {
    tips.push('🌟 Excellent équilibre de vie! Continue comme ça!');
  }
  
  return tips;
}

export default router;
