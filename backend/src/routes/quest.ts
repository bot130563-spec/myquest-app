/**
 * ==========================================
 * ⚔️ ROUTES QUEST - Gestion des quêtes
 * ==========================================
 * 
 * CRUD complet pour les quêtes + complétion.
 * Toutes les routes sont protégées (auth requise).
 * 
 * ENDPOINTS:
 * - GET    /api/quests           → Liste des quêtes
 * - POST   /api/quests           → Créer une quête
 * - GET    /api/quests/:id       → Détail d'une quête
 * - PUT    /api/quests/:id       → Modifier une quête
 * - DELETE /api/quests/:id       → Supprimer une quête
 * - POST   /api/quests/:id/complete → Compléter une quête
 * - POST   /api/quests/:id/abandon  → Abandonner une quête
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { 
  createQuestSchema, 
  updateQuestSchema, 
  getRewardsByDifficulty,
  categoryLabels,
  difficultyLabels,
  CreateQuestInput,
  UpdateQuestInput,
} from '../validators/quest';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ============================================
// 📋 GET /quests - Liste des quêtes
// ============================================
/**
 * Récupère toutes les quêtes de l'utilisateur.
 * 
 * Query params:
 * - status: ACTIVE | COMPLETED | FAILED | ABANDONED
 * - category: HEALTH | ENERGY | WISDOM | SOCIAL | WEALTH | GENERAL
 * 
 * Réponse:
 * {
 *   quests: [...],
 *   count: 10,
 *   stats: { active: 5, completed: 3, ... }
 * }
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    
    // Construit le filtre
    const where: Record<string, unknown> = {
      userId: req.userId,
    };
    
    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }
    
    if (category && typeof category === 'string') {
      where.category = category.toUpperCase();
    }
    
    // Récupère les quêtes
    const quests = await prisma.quest.findMany({
      where,
      orderBy: [
        { status: 'asc' },      // ACTIVE en premier
        { dueDate: 'asc' },     // Puis par date limite
        { createdAt: 'desc' },  // Puis les plus récentes
      ],
    });
    
    // Compte par statut (pour les stats)
    const counts = await prisma.quest.groupBy({
      by: ['status'],
      where: { userId: req.userId },
      _count: true,
    });
    
    const stats = {
      active: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
    };
    
    counts.forEach(c => {
      const key = c.status.toLowerCase() as keyof typeof stats;
      stats[key] = c._count;
    });
    
    res.json({
      quests: quests.map(q => ({
        ...q,
        categoryLabel: categoryLabels[q.category],
        difficultyLabel: difficultyLabels[q.difficulty],
      })),
      count: quests.length,
      stats,
    });
    
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des quêtes',
    });
  }
});

// ============================================
// ➕ POST /quests - Créer une quête
// ============================================
/**
 * Crée une nouvelle quête.
 * 
 * Body:
 * {
 *   "title": "Faire 30 min de sport",
 *   "description": "Aller courir ou faire de la muscu",
 *   "category": "HEALTH",
 *   "difficulty": "MEDIUM",
 *   "dueDate": "2024-02-15T18:00:00Z"  // optionnel
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Valide les données
    const result = createQuestSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }
    
    const { title, description, category, difficulty, dueDate } = result.data;
    
    // Calcule les récompenses selon la difficulté
    const rewards = getRewardsByDifficulty(difficulty);
    
    // Crée la quête
    const quest = await prisma.quest.create({
      data: {
        userId: req.userId!,
        title,
        description,
        category,
        difficulty,
        dueDate,
        xpReward: rewards.xp,
        statBoost: rewards.statBoost,
      },
    });
    
    res.status(201).json({
      message: 'Quête créée! Bonne chance, héros! ⚔️',
      quest: {
        ...quest,
        categoryLabel: categoryLabels[quest.category],
        difficultyLabel: difficultyLabels[quest.difficulty],
      },
    });
    
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la création de la quête',
    });
  }
});

// ============================================
// 🔍 GET /quests/:id - Détail d'une quête
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quest = await prisma.quest.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!quest) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quête non trouvée',
      });
      return;
    }
    
    res.json({
      ...quest,
      categoryLabel: categoryLabels[quest.category],
      difficultyLabel: difficultyLabels[quest.difficulty],
    });
    
  } catch (error) {
    console.error('Get quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération de la quête',
    });
  }
});

// ============================================
// ✏️ PUT /quests/:id - Modifier une quête
// ============================================
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Vérifie que la quête existe et appartient à l'utilisateur
    const existing = await prisma.quest.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quête non trouvée',
      });
      return;
    }
    
    // Ne peut pas modifier une quête terminée
    if (existing.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Impossible de modifier une quête terminée',
      });
      return;
    }
    
    // Valide les données
    const result = updateQuestSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }
    
    // Prépare les données de mise à jour
    const updateData: Record<string, unknown> = {};
    const data = result.data;
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    
    // Si la difficulté change, recalcule les récompenses
    if (data.difficulty !== undefined) {
      updateData.difficulty = data.difficulty;
      const rewards = getRewardsByDifficulty(data.difficulty);
      updateData.xpReward = rewards.xp;
      updateData.statBoost = rewards.statBoost;
    }
    
    const quest = await prisma.quest.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({
      message: 'Quête mise à jour! 📝',
      quest: {
        ...quest,
        categoryLabel: categoryLabels[quest.category],
        difficultyLabel: difficultyLabels[quest.difficulty],
      },
    });
    
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la mise à jour de la quête',
    });
  }
});

// ============================================
// 🗑️ DELETE /quests/:id - Supprimer une quête
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const quest = await prisma.quest.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!quest) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quête non trouvée',
      });
      return;
    }
    
    await prisma.quest.delete({
      where: { id: req.params.id },
    });
    
    res.json({
      message: 'Quête supprimée',
    });
    
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la suppression de la quête',
    });
  }
});

// ============================================
// ✅ POST /quests/:id/complete - Compléter
// ============================================
/**
 * Marque une quête comme complétée.
 * Donne les récompenses (XP + stats).
 * 
 * Réponse:
 * {
 *   message: "...",
 *   rewards: { xp: 25, statBoost: 2, statAffected: "health" },
 *   levelUp: true/false,
 *   newLevel: 2
 * }
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    // Récupère la quête
    const quest = await prisma.quest.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!quest) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quête non trouvée',
      });
      return;
    }
    
    if (quest.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cette quête n\'est plus active',
      });
      return;
    }
    
    // ── TRANSACTION: Met à jour tout d'un coup ──
    const result = await prisma.$transaction(async (tx) => {
      // 1. Marque la quête comme complétée
      await tx.quest.update({
        where: { id: quest.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      
      // 2. Récupère l'avatar actuel
      const avatar = await tx.avatar.findUnique({
        where: { userId: req.userId },
      });
      
      if (!avatar) {
        throw new Error('Avatar non trouvé');
      }
      
      // 3. Calcule le nouveau XP et niveau
      const newXp = avatar.experience + quest.xpReward;
      const xpForNextLevel = avatar.level * 100;
      
      let newLevel = avatar.level;
      let remainingXp = newXp;
      
      // Level up si assez d'XP
      while (remainingXp >= newLevel * 100) {
        remainingXp -= newLevel * 100;
        newLevel++;
      }
      
      const leveledUp = newLevel > avatar.level;
      
      // 4. Met à jour l'avatar
      await tx.avatar.update({
        where: { userId: req.userId },
        data: {
          experience: remainingXp,
          level: newLevel,
        },
      });
      
      // 5. Met à jour la stat correspondante (si pas GENERAL)
      let statAffected: string | null = null;
      
      if (quest.category !== 'GENERAL') {
        const statField = quest.category.toLowerCase();
        statAffected = statField;
        
        // Récupère les stats actuelles
        const stats = await tx.stats.findUnique({
          where: { userId: req.userId },
        });
        
        if (stats) {
          const currentValue = (stats as Record<string, unknown>)[statField] as number;
          const newValue = Math.min(100, currentValue + quest.statBoost); // Max 100
          
          await tx.stats.update({
            where: { userId: req.userId },
            data: {
              [statField]: newValue,
              // Met à jour le streak
              currentStreak: stats.currentStreak + 1,
              longestStreak: Math.max(stats.longestStreak, stats.currentStreak + 1),
            },
          });
        }
      } else {
        // Quête générale: juste update le streak
        await tx.stats.update({
          where: { userId: req.userId },
          data: {
            currentStreak: { increment: 1 },
          },
        });
        
        // Met à jour longestStreak si nécessaire
        const stats = await tx.stats.findUnique({
          where: { userId: req.userId },
        });
        
        if (stats && stats.currentStreak + 1 > stats.longestStreak) {
          await tx.stats.update({
            where: { userId: req.userId },
            data: {
              longestStreak: stats.currentStreak + 1,
            },
          });
        }
      }
      
      return {
        leveledUp,
        newLevel,
        xpGained: quest.xpReward,
        statAffected,
        statBoost: quest.statBoost,
      };
    });
    
    // Message de succès personnalisé
    let message = `Quête accomplie! +${result.xpGained} XP`;
    if (result.statAffected) {
      message += ` et +${result.statBoost} ${categoryLabels[quest.category.toUpperCase()]}`;
    }
    if (result.leveledUp) {
      message += ` 🎉 LEVEL UP! Tu es maintenant niveau ${result.newLevel}!`;
    }
    
    res.json({
      message,
      rewards: {
        xp: result.xpGained,
        statBoost: result.statBoost,
        statAffected: result.statAffected,
      },
      levelUp: result.leveledUp,
      newLevel: result.newLevel,
    });
    
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la complétion de la quête',
    });
  }
});

// ============================================
// 🏳️ POST /quests/:id/abandon - Abandonner
// ============================================
router.post('/:id/abandon', async (req: Request, res: Response) => {
  try {
    const quest = await prisma.quest.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!quest) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quête non trouvée',
      });
      return;
    }
    
    if (quest.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cette quête n\'est plus active',
      });
      return;
    }
    
    await prisma.quest.update({
      where: { id: quest.id },
      data: {
        status: 'ABANDONED',
      },
    });
    
    // Reset le streak (abandon = perte du streak)
    await prisma.stats.update({
      where: { userId: req.userId },
      data: {
        currentStreak: 0,
      },
    });
    
    res.json({
      message: 'Quête abandonnée. Ton streak a été réinitialisé. Ne baisse pas les bras! 💪',
    });
    
  } catch (error) {
    console.error('Abandon quest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de l\'abandon de la quête',
    });
  }
});

export default router;
