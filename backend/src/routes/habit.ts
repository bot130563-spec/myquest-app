/**
 * ==========================================
 * 🔄 ROUTES HABIT - Habitudes récurrentes
 * ==========================================
 * 
 * ENDPOINTS:
 * - GET    /api/habits           → Liste des habitudes
 * - POST   /api/habits           → Créer une habitude
 * - GET    /api/habits/today     → Habitudes du jour avec statut
 * - GET    /api/habits/:id       → Détail d'une habitude
 * - PUT    /api/habits/:id       → Modifier une habitude
 * - DELETE /api/habits/:id       → Supprimer une habitude
 * - POST   /api/habits/:id/complete → Compléter l'habitude du jour
 * - GET    /api/habits/:id/history  → Historique des complétions
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import {
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  frequencyLabels,
  categoryLabels,
  shouldDoToday,
  dayNames,
} from '../validators/habit';

const router = Router();
router.use(authMiddleware);

// ============================================
// 📋 GET /habits - Liste des habitudes
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      habits: habits.map(h => ({
        ...h,
        categoryLabel: categoryLabels[h.category],
        frequencyLabel: frequencyLabels[h.frequency],
        shouldDoToday: shouldDoToday(h.frequency, h.targetDays as number[]),
      })),
      count: habits.length,
    });
    
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des habitudes',
    });
  }
});

// ============================================
// 📅 GET /habits/today - Habitudes du jour
// ============================================
/**
 * Retourne les habitudes à faire aujourd'hui avec leur statut
 * (complétée ou non)
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    // Date du jour (sans heure)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupère les habitudes actives
    const habits = await prisma.habit.findMany({
      where: {
        userId: req.userId,
        isActive: true,
      },
      include: {
        logs: {
          where: {
            completedDate: today,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Filtre celles qui doivent être faites aujourd'hui
    const todayHabits = habits
      .filter(h => shouldDoToday(h.frequency, h.targetDays as number[]))
      .map(h => ({
        ...h,
        categoryLabel: categoryLabels[h.category],
        frequencyLabel: frequencyLabels[h.frequency],
        isCompletedToday: h.logs.length > 0,
        todayLog: h.logs[0] || null,
        logs: undefined, // Ne pas renvoyer tous les logs
      }));
    
    const completed = todayHabits.filter(h => h.isCompletedToday).length;
    const total = todayHabits.length;
    
    res.json({
      date: today.toISOString().split('T')[0],
      dayName: dayNames[today.getDay()],
      habits: todayHabits,
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 100,
      },
    });
    
  } catch (error) {
    console.error('Get today habits error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des habitudes du jour',
    });
  }
});

// ============================================
// ➕ POST /habits - Créer une habitude
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = createHabitSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }
    
    const data = result.data;
    
    const habit = await prisma.habit.create({
      data: {
        userId: req.userId!,
        title: data.title,
        description: data.description,
        icon: data.icon,
        category: data.category,
        frequency: data.frequency,
        targetDays: data.targetDays,
        targetCount: data.targetCount,
      },
    });
    
    res.status(201).json({
      message: 'Habitude créée! Constance = succès 🔄',
      habit: {
        ...habit,
        categoryLabel: categoryLabels[habit.category],
        frequencyLabel: frequencyLabels[habit.frequency],
      },
    });
    
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la création de l\'habitude',
    });
  }
});

// ============================================
// 🔍 GET /habits/:id - Détail
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }
    
    res.json({
      ...habit,
      categoryLabel: categoryLabels[habit.category],
      frequencyLabel: frequencyLabels[habit.frequency],
    });
    
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération de l\'habitude',
    });
  }
});

// ============================================
// ✏️ PUT /habits/:id - Modifier
// ============================================
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }
    
    const result = updateHabitSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }
    
    const habit = await prisma.habit.update({
      where: { id: req.params.id },
      data: result.data,
    });
    
    res.json({
      message: 'Habitude mise à jour! 📝',
      habit: {
        ...habit,
        categoryLabel: categoryLabels[habit.category],
        frequencyLabel: frequencyLabels[habit.frequency],
      },
    });
    
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la mise à jour',
    });
  }
});

// ============================================
// 🗑️ DELETE /habits/:id - Supprimer
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }
    
    await prisma.habit.delete({
      where: { id: req.params.id },
    });
    
    res.json({ message: 'Habitude supprimée' });
    
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la suppression',
    });
  }
});

// ============================================
// ✅ POST /habits/:id/complete - Compléter
// ============================================
/**
 * Marque l'habitude comme complétée pour aujourd'hui.
 * Donne XP + stat boost + gère le streak.
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
        isActive: true,
      },
    });
    
    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée ou inactive',
      });
      return;
    }
    
    // Valide les données
    const result = completeHabitSchema.safeParse(req.body);
    const data = result.success ? result.data : { date: new Date(), note: undefined };
    
    // Date sans heure
    const completionDate = new Date(data.date);
    completionDate.setHours(0, 0, 0, 0);
    
    // Vérifie si déjà complétée ce jour
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_completedDate: {
          habitId: habit.id,
          completedDate: completionDate,
        },
      },
    });
    
    if (existingLog) {
      res.status(400).json({
        error: 'Already Completed',
        message: 'Tu as déjà complété cette habitude aujourd\'hui! 👍',
      });
      return;
    }
    
    // ── TRANSACTION ──
    const rewards = await prisma.$transaction(async (tx) => {
      // 1. Crée le log
      await tx.habitLog.create({
        data: {
          habitId: habit.id,
          completedDate: completionDate,
          note: data.note,
        },
      });
      
      // 2. Met à jour les compteurs de l'habitude
      // Calcule le nouveau streak
      const yesterday = new Date(completionDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayLog = await tx.habitLog.findUnique({
        where: {
          habitId_completedDate: {
            habitId: habit.id,
            completedDate: yesterday,
          },
        },
      });
      
      const newStreak = yesterdayLog ? habit.currentStreak + 1 : 1;
      const newLongest = Math.max(habit.longestStreak, newStreak);

      await tx.habit.update({
        where: { id: habit.id },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          streakCount: newStreak,
          totalCompletions: { increment: 1 },
          lastCompletedAt: new Date(),
        },
      });
      
      // 3. Donne l'XP à l'avatar
      const avatar = await tx.avatar.findUnique({
        where: { userId: req.userId },
      });
      
      if (!avatar) throw new Error('Avatar non trouvé');
      
      const newXp = avatar.experience + habit.xpReward;
      let newLevel = avatar.level;
      let remainingXp = newXp;
      
      while (remainingXp >= newLevel * 100) {
        remainingXp -= newLevel * 100;
        newLevel++;
      }
      
      const leveledUp = newLevel > avatar.level;
      
      await tx.avatar.update({
        where: { userId: req.userId },
        data: {
          experience: remainingXp,
          level: newLevel,
        },
      });
      
      // 4. Met à jour la stat correspondante
      if (habit.category !== 'GENERAL') {
        const statField = habit.category.toLowerCase();
        const stats = await tx.stats.findUnique({
          where: { userId: req.userId },
        });
        
        if (stats) {
          const currentValue = (stats as Record<string, unknown>)[statField] as number;
          const newValue = Math.min(100, currentValue + habit.statBoost);
          
          await tx.stats.update({
            where: { userId: req.userId },
            data: { [statField]: newValue },
          });
        }
      }
      
      return {
        xp: habit.xpReward,
        statBoost: habit.statBoost,
        category: habit.category,
        newStreak,
        leveledUp,
        newLevel,
      };
    });
    
    // Message personnalisé
    let message = `${habit.icon} Habitude complétée! +${rewards.xp} XP`;
    if (rewards.newStreak > 1) {
      message += ` 🔥 Streak: ${rewards.newStreak} jours!`;
    }
    if (rewards.leveledUp) {
      message = `🎉 LEVEL UP! Niveau ${rewards.newLevel}! ` + message;
    }
    
    res.json({
      message,
      rewards: {
        xp: rewards.xp,
        statBoost: rewards.statBoost,
        statAffected: rewards.category !== 'GENERAL' ? rewards.category.toLowerCase() : null,
      },
      streak: rewards.newStreak,
      levelUp: rewards.leveledUp,
      newLevel: rewards.newLevel,
    });
    
  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la complétion',
    });
  }
});

// ============================================
// 📊 GET /habits/:id/history - Historique
// ============================================
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }
    
    // Récupère les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: habit.id,
        completedDate: { gte: thirtyDaysAgo },
      },
      orderBy: { completedDate: 'desc' },
    });
    
    res.json({
      habit: {
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        totalCompletions: habit.totalCompletions,
      },
      logs,
      completedDates: logs.map(l => l.completedDate.toISOString().split('T')[0]),
    });
    
  } catch (error) {
    console.error('Get habit history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
});

// ============================================
// ⏰ PATCH /habits/:id/reminder - Configurer le rappel
// ============================================
router.patch('/:id/reminder', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }

    const { reminderTime } = req.body;

    // Validation basique du format HH:mm
    if (reminderTime && !/^\d{2}:\d{2}$/.test(reminderTime)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Format invalide. Utilise HH:mm (ex: 08:00)',
      });
      return;
    }

    const updated = await prisma.habit.update({
      where: { id: req.params.id },
      data: { reminderTime: reminderTime || null },
    });

    res.json({
      message: reminderTime
        ? `⏰ Rappel configuré à ${reminderTime}`
        : '⏰ Rappel supprimé',
      habit: {
        id: updated.id,
        title: updated.title,
        reminderTime: updated.reminderTime,
      },
    });

  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la configuration du rappel',
    });
  }
});

// ============================================
// 🔥 GET /habits/:id/streak - Streak actuel
// ============================================
router.get('/:id/streak', async (req: Request, res: Response) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      select: {
        id: true,
        title: true,
        icon: true,
        currentStreak: true,
        streakCount: true,
        longestStreak: true,
        lastCompletedAt: true,
        totalCompletions: true,
      },
    });

    if (!habit) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Habitude non trouvée',
      });
      return;
    }

    res.json({
      habitId: habit.id,
      title: habit.title,
      icon: habit.icon,
      currentStreak: habit.currentStreak,
      streakCount: habit.streakCount,
      longestStreak: habit.longestStreak,
      lastCompletedAt: habit.lastCompletedAt,
      totalCompletions: habit.totalCompletions,
    });

  } catch (error) {
    console.error('Get habit streak error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération du streak',
    });
  }
});

export default router;
