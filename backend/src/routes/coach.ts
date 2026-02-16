/**
 * ==========================================
 * 🤖 ROUTES COACH IA
 * ==========================================
 * 
 * Génère des conseils personnalisés basés sur:
 * - Les stats du joueur
 * - Les quêtes en cours
 * - Les habitudes et leur streak
 * - Les entrées journal récentes
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Types pour l'analyse
interface UserContext {
  stats: {
    health: number;
    energy: number;
    wisdom: number;
    social: number;
    wealth: number;
    currentStreak: number;
  };
  activeQuests: number;
  completedQuests: number;
  habits: {
    total: number;
    completedToday: number;
    bestStreak: number;
  };
  recentMood: number | null;
  level: number;
}

// ============================================
// 🎯 GET /coach/advice - Obtenir des conseils
// ============================================
router.get('/advice', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Récupérer toutes les données de l'utilisateur
    const [user, stats, quests, habits, journalEntries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { avatar: true }
      }),
      prisma.stats.findUnique({ where: { userId } }),
      prisma.quest.findMany({ where: { userId } }),
      prisma.habit.findMany({ 
        where: { userId },
        include: { logs: { take: 7, orderBy: { completedAt: 'desc' } } }
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    // Construire le contexte utilisateur
    const today = new Date().toISOString().split('T')[0];
    const activeQuests = quests.filter(q => q.status === 'ACTIVE').length;
    const completedQuests = quests.filter(q => q.status === 'COMPLETED').length;
    
    const habitsCompletedToday = habits.filter(h => 
      h.logs.some(log => log.completedDate.toISOString().split('T')[0] === today)
    ).length;
    
    const bestHabitStreak = Math.max(...habits.map(h => h.currentStreak), 0);
    
    const recentMoods = journalEntries
      .filter(j => j.mood !== null)
      .map(j => j.mood as number);
    const avgMood = recentMoods.length > 0 
      ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length 
      : null;

    const context: UserContext = {
      stats: {
        health: stats.health,
        energy: stats.energy,
        wisdom: stats.wisdom,
        social: stats.social,
        wealth: stats.wealth,
        currentStreak: stats.currentStreak
      },
      activeQuests,
      completedQuests,
      habits: {
        total: habits.length,
        completedToday: habitsCompletedToday,
        bestStreak: bestHabitStreak
      },
      recentMood: avgMood,
      level: user?.avatar?.level || 1
    };

    // Générer les conseils
    const advice = generateAdvice(context);

    res.json({
      advice,
      context: {
        level: context.level,
        stats: context.stats,
        questsActive: activeQuests,
        questsCompleted: completedQuests,
        habitsToday: `${habitsCompletedToday}/${habits.length}`,
        mood: avgMood ? Math.round(avgMood * 10) / 10 : null
      }
    });

  } catch (error) {
    console.error('Coach advice error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la génération des conseils'
    });
  }
});

// ============================================
// 🧠 GÉNÉRATEUR DE CONSEILS
// ============================================
function generateAdvice(ctx: UserContext): {
  greeting: string;
  tips: Array<{ icon: string; category: string; message: string; priority: 'high' | 'medium' | 'low' }>;
  motivation: string;
  focus: string;
} {
  const tips: Array<{ icon: string; category: string; message: string; priority: 'high' | 'medium' | 'low' }> = [];
  
  // Analyse des stats faibles (< 30)
  const weakStats: string[] = [];
  if (ctx.stats.health < 30) weakStats.push('santé');
  if (ctx.stats.energy < 30) weakStats.push('énergie');
  if (ctx.stats.wisdom < 30) weakStats.push('sagesse');
  if (ctx.stats.social < 30) weakStats.push('social');
  if (ctx.stats.wealth < 30) weakStats.push('finances');

  // Conseil sur les stats faibles
  if (weakStats.length > 0) {
    const statTips: Record<string, { icon: string; message: string }> = {
      'santé': { icon: '❤️', message: 'Ta santé est basse. Essaie une quête sport ou méditation aujourd\'hui!' },
      'énergie': { icon: '⚡', message: 'Ton énergie diminue. Prends une pause, fais une sieste ou va marcher.' },
      'sagesse': { icon: '📚', message: 'Booste ta sagesse! Lis 10 pages d\'un livre ou regarde une vidéo éducative.' },
      'social': { icon: '👥', message: 'Ton social est bas. Appelle un ami ou rejoins une activité de groupe!' },
      'finances': { icon: '💰', message: 'Tes finances ont besoin d\'attention. Revois ton budget ou cherche une opportunité.' }
    };
    
    weakStats.forEach(stat => {
      tips.push({
        icon: statTips[stat].icon,
        category: stat.charAt(0).toUpperCase() + stat.slice(1),
        message: statTips[stat].message,
        priority: 'high'
      });
    });
  }

  // Conseil sur les habitudes
  if (ctx.habits.total > 0 && ctx.habits.completedToday < ctx.habits.total) {
    const remaining = ctx.habits.total - ctx.habits.completedToday;
    tips.push({
      icon: '🔄',
      category: 'Habitudes',
      message: `Il te reste ${remaining} habitude${remaining > 1 ? 's' : ''} à compléter aujourd'hui. Tu peux le faire!`,
      priority: ctx.habits.completedToday === 0 ? 'high' : 'medium'
    });
  } else if (ctx.habits.total > 0 && ctx.habits.completedToday === ctx.habits.total) {
    tips.push({
      icon: '🌟',
      category: 'Habitudes',
      message: 'Bravo! Tu as complété toutes tes habitudes aujourd\'hui! Continue comme ça!',
      priority: 'low'
    });
  }

  // Conseil sur les quêtes
  if (ctx.activeQuests === 0 && ctx.completedQuests < 3) {
    tips.push({
      icon: '⚔️',
      category: 'Quêtes',
      message: 'Tu n\'as pas de quête active. Crée-en une pour progresser dans ton aventure!',
      priority: 'medium'
    });
  } else if (ctx.activeQuests > 5) {
    tips.push({
      icon: '🎯',
      category: 'Focus',
      message: 'Tu as beaucoup de quêtes actives. Concentre-toi sur 2-3 prioritaires pour avancer plus vite.',
      priority: 'medium'
    });
  }

  // Conseil sur l'humeur
  if (ctx.recentMood !== null && ctx.recentMood < 3) {
    tips.push({
      icon: '💙',
      category: 'Bien-être',
      message: 'Ton humeur récente semble basse. Prends soin de toi - une petite victoire peut tout changer!',
      priority: 'high'
    });
  }

  // Conseil sur le streak
  if (ctx.stats.currentStreak >= 7) {
    tips.push({
      icon: '🔥',
      category: 'Streak',
      message: `Incroyable! ${ctx.stats.currentStreak} jours de streak! Tu es sur une lancée fantastique!`,
      priority: 'low'
    });
  } else if (ctx.stats.currentStreak === 0) {
    tips.push({
      icon: '🌱',
      category: 'Nouveau départ',
      message: 'Chaque jour est une nouvelle chance. Commence petit, mais commence maintenant!',
      priority: 'medium'
    });
  }

  // Générer le greeting basé sur l'heure
  const hour = new Date().getHours();
  let greeting: string;
  if (hour < 12) {
    greeting = 'Bonjour, héros! ☀️';
  } else if (hour < 18) {
    greeting = 'Bon après-midi, aventurier! 🌤️';
  } else {
    greeting = 'Bonsoir, champion! 🌙';
  }

  // Message de motivation basé sur le niveau
  const motivations = [
    'Chaque petit pas compte. Tu construis ta légende!',
    'Les héros ne naissent pas, ils se forgent jour après jour.',
    'Ta seule limite est celle que tu te fixes.',
    'Le succès est la somme de petits efforts répétés.',
    'Aujourd\'hui est le premier jour du reste de ton aventure!'
  ];
  const motivation = motivations[Math.floor(Math.random() * motivations.length)];

  // Déterminer le focus principal
  let focus: string;
  if (tips.some(t => t.priority === 'high' && t.category !== 'Streak')) {
    const highPriority = tips.find(t => t.priority === 'high');
    focus = `Priorité: ${highPriority?.category}`;
  } else if (ctx.habits.completedToday < ctx.habits.total) {
    focus = 'Complète tes habitudes du jour';
  } else if (ctx.activeQuests > 0) {
    focus = 'Avance sur tes quêtes actives';
  } else {
    focus = 'Explore et crée de nouveaux objectifs';
  }

  // Trier les tips par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    greeting,
    tips: tips.slice(0, 5), // Max 5 conseils
    motivation,
    focus
  };
}

export default router;
