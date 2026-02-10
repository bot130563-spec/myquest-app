/**
 * ==========================================
 * 📓 ROUTES JOURNAL - Journal personnel
 * ==========================================
 * 
 * ENDPOINTS:
 * - GET    /api/journal           → Liste des entrées (paginée)
 * - GET    /api/journal/today     → Entrée du jour
 * - GET    /api/journal/stats     → Statistiques du journal
 * - POST   /api/journal           → Créer/mettre à jour l'entrée du jour
 * - GET    /api/journal/:date     → Entrée d'une date spécifique
 * - DELETE /api/journal/:date     → Supprimer une entrée
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { journalEntrySchema, moodEmojis, moodLabels } from '../validators/journal';

const router = Router();
router.use(authMiddleware);

// ============================================
// 📋 GET /journal - Liste des entrées
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.userId },
      orderBy: { entryDate: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.journalEntry.count({
      where: { userId: req.userId },
    });
    
    res.json({
      entries: entries.map(e => ({
        ...e,
        moodEmoji: moodEmojis[e.mood],
        moodLabel: moodLabels[e.mood],
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
    
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération du journal',
    });
  }
});

// ============================================
// 📅 GET /journal/today - Entrée du jour
// ============================================
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entry = await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: req.userId!,
          entryDate: today,
        },
      },
    });
    
    if (!entry) {
      res.json({
        exists: false,
        date: today.toISOString().split('T')[0],
        entry: null,
      });
      return;
    }
    
    res.json({
      exists: true,
      date: today.toISOString().split('T')[0],
      entry: {
        ...entry,
        moodEmoji: moodEmojis[entry.mood],
        moodLabel: moodLabels[entry.mood],
      },
    });
    
  } catch (error) {
    console.error('Get today entry error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération',
    });
  }
});

// ============================================
// 📊 GET /journal/stats - Statistiques
// ============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Compte total d'entrées
    const totalEntries = await prisma.journalEntry.count({
      where: { userId: req.userId },
    });
    
    // Moyenne des humeurs
    const moodAvg = await prisma.journalEntry.aggregate({
      where: { userId: req.userId },
      _avg: { mood: true },
    });
    
    // Entrées des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = await prisma.journalEntry.findMany({
      where: {
        userId: req.userId,
        entryDate: { gte: thirtyDaysAgo },
      },
      select: { entryDate: true, mood: true },
      orderBy: { entryDate: 'asc' },
    });
    
    // Calcul du streak d'écriture
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.userId },
      select: { entryDate: true },
      orderBy: { entryDate: 'desc' },
      take: 100,
    });
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < entries.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      const entryDate = new Date(entries[i].entryDate);
      entryDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Distribution des humeurs
    const moodDistribution = await prisma.journalEntry.groupBy({
      by: ['mood'],
      where: { userId: req.userId },
      _count: true,
    });
    
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    moodDistribution.forEach(m => {
      distribution[m.mood] = m._count;
    });
    
    res.json({
      totalEntries,
      averageMood: Math.round((moodAvg._avg.mood || 3) * 10) / 10,
      currentStreak,
      last30Days: recentEntries.map(e => ({
        date: e.entryDate.toISOString().split('T')[0],
        mood: e.mood,
        moodEmoji: moodEmojis[e.mood],
      })),
      moodDistribution: Object.entries(distribution).map(([mood, count]) => ({
        mood: parseInt(mood),
        emoji: moodEmojis[parseInt(mood)],
        label: moodLabels[parseInt(mood)],
        count,
      })),
    });
    
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération des stats',
    });
  }
});

// ============================================
// ➕ POST /journal - Créer/MAJ entrée
// ============================================
/**
 * Crée ou met à jour l'entrée du jour.
 * Donne 15 XP la première fois qu'on écrit dans la journée.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = journalEntrySchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }
    
    const data = result.data;
    const entryDate = data.entryDate || new Date();
    entryDate.setHours(0, 0, 0, 0);
    
    // Vérifie si une entrée existe déjà
    const existing = await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: req.userId!,
          entryDate,
        },
      },
    });
    
    let entry;
    let xpAwarded = false;
    let message: string;
    
    if (existing) {
      // Mise à jour
      entry = await prisma.journalEntry.update({
        where: { id: existing.id },
        data: {
          mood: data.mood,
          content: data.content,
          gratitudes: data.gratitudes,
          dailyGoal: data.dailyGoal,
          reflection: data.reflection,
          tags: data.tags,
        },
      });
      message = 'Journal mis à jour! 📝';
    } else {
      // Création + XP
      entry = await prisma.$transaction(async (tx) => {
        // Crée l'entrée
        const newEntry = await tx.journalEntry.create({
          data: {
            userId: req.userId!,
            entryDate,
            mood: data.mood,
            content: data.content,
            gratitudes: data.gratitudes,
            dailyGoal: data.dailyGoal,
            reflection: data.reflection,
            tags: data.tags,
            xpAwarded: true,
          },
        });
        
        // Donne l'XP
        const avatar = await tx.avatar.findUnique({
          where: { userId: req.userId },
        });
        
        if (avatar) {
          const newXp = avatar.experience + 15;
          let newLevel = avatar.level;
          let remainingXp = newXp;
          
          while (remainingXp >= newLevel * 100) {
            remainingXp -= newLevel * 100;
            newLevel++;
          }
          
          await tx.avatar.update({
            where: { userId: req.userId },
            data: {
              experience: remainingXp,
              level: newLevel,
            },
          });
        }
        
        // Boost la stat wisdom (écrire = sagesse)
        await tx.stats.update({
          where: { userId: req.userId },
          data: {
            wisdom: { increment: 1 },
          },
        });
        
        return newEntry;
      });
      
      xpAwarded = true;
      message = 'Journal enregistré! +15 XP 📓';
    }
    
    res.status(existing ? 200 : 201).json({
      message,
      entry: {
        ...entry,
        moodEmoji: moodEmojis[entry.mood],
        moodLabel: moodLabels[entry.mood],
      },
      xpAwarded,
    });
    
  } catch (error) {
    console.error('Create/update journal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de l\'enregistrement',
    });
  }
});

// ============================================
// 🔍 GET /journal/:date - Entrée par date
// ============================================
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const dateStr = req.params.date;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Format de date invalide (utilisez YYYY-MM-DD)',
      });
      return;
    }
    
    date.setHours(0, 0, 0, 0);
    
    const entry = await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: req.userId!,
          entryDate: date,
        },
      },
    });
    
    if (!entry) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Pas d\'entrée pour cette date',
      });
      return;
    }
    
    res.json({
      ...entry,
      moodEmoji: moodEmojis[entry.mood],
      moodLabel: moodLabels[entry.mood],
    });
    
  } catch (error) {
    console.error('Get journal by date error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la récupération',
    });
  }
});

// ============================================
// 🗑️ DELETE /journal/:date - Supprimer
// ============================================
router.delete('/:date', async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Format de date invalide',
      });
      return;
    }
    
    date.setHours(0, 0, 0, 0);
    
    const entry = await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: req.userId!,
          entryDate: date,
        },
      },
    });
    
    if (!entry) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Entrée non trouvée',
      });
      return;
    }
    
    await prisma.journalEntry.delete({
      where: { id: entry.id },
    });
    
    res.json({ message: 'Entrée supprimée' });
    
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la suppression',
    });
  }
});

export default router;
