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

// ============================================
// 💬 POST /coach/message - Chat avec le coach
// ============================================
router.post('/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Récupérer le contexte utilisateur complet
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
        take: 7
      })
    ]);

    if (!stats || !user) {
      return res.status(404).json({ error: 'User data not found' });
    }

    // Construire le contexte
    const today = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = habits.filter(h =>
      h.logs.some(log => log.completedDate.toISOString().split('T')[0] === today)
    ).length;

    const context = {
      userName: user.name,
      level: user.avatar?.level || 1,
      stats: {
        health: stats.health,
        energy: stats.energy,
        wisdom: stats.wisdom,
        social: stats.social,
        wealth: stats.wealth,
        currentStreak: stats.currentStreak
      },
      habits: habits.map(h => ({
        title: h.title,
        category: h.category,
        currentStreak: h.currentStreak,
        completedToday: h.logs.some(log => log.completedDate.toISOString().split('T')[0] === today)
      })),
      quests: quests.filter(q => q.status === 'ACTIVE').map(q => ({
        title: q.title,
        category: q.category
      })),
      journalEntries: journalEntries.map(j => ({
        content: j.content,
        mood: j.mood,
        date: j.createdAt
      }))
    };

    // Si l'API Anthropic est disponible, l'utiliser
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let reply: string;
    let phase: string = 'phase1';

    if (anthropicKey) {
      // TODO: Implémenter l'appel à l'API Anthropic
      // Pour l'instant, mode mock intelligent
      reply = generateIntelligentMockReply(message, context);
    } else {
      reply = generateIntelligentMockReply(message, context);
    }

    // Déterminer la phase selon le contenu de la conversation
    if (message.toLowerCase().includes('vision') || message.toLowerCase().includes('objectif')) {
      phase = 'phase2';
    } else if (message.toLowerCase().includes('habitude') || message.toLowerCase().includes('routine')) {
      phase = 'phase3';
    } else if (message.toLowerCase().includes('plan') || message.toLowerCase().includes('action')) {
      phase = 'phase4';
    }

    res.json({
      reply,
      sessionId: sessionId || `session-${Date.now()}`,
      phase,
      suggestedActions: getSuggestedActions(context)
    });

  } catch (error) {
    console.error('Coach message error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la communication avec le coach'
    });
  }
});

// ============================================
// 📋 GET /coach/phases - Les 4 phases du coaching
// ============================================
router.get('/phases', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // Récupérer les stats pour déterminer la progression
    const [stats, habits, journal] = await Promise.all([
      prisma.stats.findUnique({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId } })
    ]);

    const phases = [
      {
        id: 'phase1',
        title: 'Connaissance de soi',
        icon: 'brain',
        description: 'Explore tes valeurs, forces et émotions',
        status: journal > 0 ? 'completed' : 'in_progress',
        progress: journal > 0 ? 100 : 50
      },
      {
        id: 'phase2',
        title: 'Vision & Ambitions',
        icon: 'target',
        description: 'Définis ta vision à court, moyen et long terme',
        status: journal > 3 ? 'in_progress' : 'locked',
        progress: journal > 3 ? 30 : 0
      },
      {
        id: 'phase3',
        title: 'Habitudes',
        icon: 'repeat',
        description: 'Analyse et optimise tes habitudes avec Atomic Habits',
        status: habits > 0 ? 'in_progress' : 'locked',
        progress: habits > 0 ? 60 : 0
      },
      {
        id: 'phase4',
        title: 'Plan d\'action',
        icon: 'flash',
        description: 'Crée des systèmes pour atteindre tes objectifs',
        status: (habits > 2 && journal > 5) ? 'in_progress' : 'locked',
        progress: (habits > 2 && journal > 5) ? 20 : 0
      }
    ];

    res.json({ phases });

  } catch (error) {
    console.error('Coach phases error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors du chargement des phases'
    });
  }
});

// ============================================
// 🔍 POST /coach/habit-analysis - Analyse Atomic Habits
// ============================================
router.post('/habit-analysis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { logs: { take: 30, orderBy: { completedAt: 'desc' } } }
    });

    const analysis = habits.map(habit => {
      const completionRate = habit.logs.length / 30;
      const streak = habit.currentStreak;

      let score = 0;
      let recommendation = '';
      let atomicLaw = '';

      if (streak > 7 && completionRate > 0.7) {
        score = 90;
        recommendation = 'Excellente habitude! Continue ainsi.';
        atomicLaw = 'Loi 4: Tu rends cette habitude satisfaisante';
      } else if (streak > 3 && completionRate > 0.5) {
        score = 70;
        recommendation = 'Bonne progression. Rends-la encore plus facile.';
        atomicLaw = 'Loi 3: Réduis encore la friction';
      } else if (completionRate < 0.3) {
        score = 40;
        recommendation = 'Habitude difficile. Applique la règle des 2 minutes.';
        atomicLaw = 'Loi 3: Rendre facile - commence par 2 min';
      } else {
        score = 55;
        recommendation = 'Crée un signal clair pour déclencher cette habitude.';
        atomicLaw = 'Loi 1: Rendre évident';
      }

      return {
        habitId: habit.id,
        title: habit.title,
        score,
        streak,
        completionRate: Math.round(completionRate * 100),
        status: score > 70 ? 'strong' : score > 50 ? 'developing' : 'needs_work',
        recommendation,
        atomicLaw
      };
    });

    res.json({
      analysis,
      overallScore: analysis.length > 0
        ? Math.round(analysis.reduce((sum, h) => sum + h.score, 0) / analysis.length)
        : 0,
      totalHabits: habits.length
    });

  } catch (error) {
    console.error('Habit analysis error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de l\'analyse des habitudes'
    });
  }
});

// ============================================
// 🧠 FONCTIONS HELPER
// ============================================

function generateIntelligentMockReply(message: string, context: any): string {
  const lowerMsg = message.toLowerCase();
  const userName = context.userName || 'héros';

  // Check-in émotionnel
  if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut') || lowerMsg.includes('hello')) {
    return `Bonjour ${userName}! 👋 Comment tu arrives dans cette session aujourd'hui? Sur une échelle de 1 à 10, comment tu te sens?`;
  }

  // Réponse à un chiffre (humeur)
  if (/^\d+$/.test(message.trim())) {
    const mood = parseInt(message.trim());
    if (mood >= 7) {
      return `Super! ${mood}/10, c'est génial! 🌟 Qu'est-ce qui contribue à cette belle énergie aujourd'hui?`;
    } else if (mood >= 4) {
      return `Je vois, ${mood}/10. C'est une humeur neutre. Qu'est-ce qui pourrait faire passer ça à un 7 ou 8?`;
    } else {
      return `${mood}/10... Je sens que c'est difficile en ce moment. Veux-tu m'en parler? Qu'est-ce qui pèse sur toi?`;
    }
  }

  // Analyse des habitudes
  if (context.habits.length > 0) {
    const avgStreak = context.habits.reduce((sum: number, h: any) => sum + h.currentStreak, 0) / context.habits.length;
    if (avgStreak < 3) {
      return `${userName}, j'ai remarqué que tes habitudes ont du mal à décoller. Appliquons Atomic Habits ensemble: choisis UNE habitude et rendons-la ridiculement facile. Règle des 2 minutes: quelle version mini de cette habitude pourrais-tu faire en 2 min?`;
    }
  }

  // Questions de vision
  if (lowerMsg.includes('vision') || lowerMsg.includes('futur') || lowerMsg.includes('objectif')) {
    return `Belle question! Ferme les yeux un instant... Imagine-toi dans 5 ans, vivant ta meilleure vie. Où es-tu? Que fais-tu? Qui t'entoure? Décris-moi cette scène en quelques mots.`;
  }

  // Questions d'introspection
  if (lowerMsg.includes('valeur') || lowerMsg.includes('important')) {
    return `Question profonde 🤔. Pense à un moment récent où tu t'es senti vraiment vivant, aligné. Qu'est-ce qui se passait? Ça révèle souvent nos vraies valeurs.`;
  }

  // Plan d'action
  if (lowerMsg.includes('plan') || lowerMsg.includes('comment')) {
    return `Excellente question! Plutôt que de fixer un objectif, créons un système. Si tu veux [X], quel comportement quotidien de 2 minutes pourrait t'y mener? L'identité d'abord: qui dois-tu devenir pour atteindre ça?`;
  }

  // Réponse générique intelligente
  return `Intéressant, ${userName}. Je t'écoute. Continue... qu'est-ce que ça signifie pour toi? Qu'est-ce que ça révèle sur ce qui compte vraiment?`;
}

function getSuggestedActions(context: any): string[] {
  const suggestions: string[] = [];

  if (context.habits.length === 0) {
    suggestions.push('Crée ta première habitude');
  }

  if (context.quests.length === 0) {
    suggestions.push('Définis une quête pour cette semaine');
  }

  if (context.journalEntries.length === 0) {
    suggestions.push('Écris ton premier journal');
  }

  if (context.stats.currentStreak === 0) {
    suggestions.push('Lance ton streak dès aujourd\'hui!');
  }

  return suggestions.length > 0 ? suggestions : ['Continue ton excellente progression!'];
}

export default router;
