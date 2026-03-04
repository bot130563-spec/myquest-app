/**
 * ==========================================
 * 🤖 ROUTES AGENT - API du coach de vie
 * ==========================================
 *
 * Endpoints pour interagir avec l'agent coach indépendant
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import {
  chat,
  analyzeHabits,
  getOnboarding,
} from '../agent/coachEngine';

const router = express.Router();
const prisma = new PrismaClient();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// ============================================
// 💬 POST /api/agent/chat - Converser avec le coach
// ============================================

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chat(userId, message, sessionId);

    res.json(response);
  } catch (error) {
    console.error('Error in /agent/chat:', error);
    res.status(500).json({ error: 'Failed to chat with coach' });
  }
});

// ============================================
// 📊 GET /api/agent/profile - Récupérer le profil coach
// ============================================

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.json({
        exists: false,
        message: 'No coach profile yet. Start your onboarding!',
      });
    }

    res.json({
      exists: true,
      profile,
    });
  } catch (error) {
    console.error('Error in /agent/profile:', error);
    res.status(500).json({ error: 'Failed to fetch coach profile' });
  }
});

// ============================================
// 📝 POST /api/agent/onboarding - Sauvegarder l'onboarding
// ============================================

router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { values, vision, strengths, shadows } = req.body;

    // Validation basique
    if (!values && !vision && !strengths && !shadows) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    // Créer ou mettre à jour le profil (V2)
    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentPhase: 1,
        values: values || null,
        vision: vision || null,
        strengths: strengths || null,
        shadows: shadows || null,
      },
      update: {
        values: values || undefined,
        vision: vision || undefined,
        strengths: strengths || undefined,
        shadows: shadows || undefined,
      },
    });

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error in /agent/onboarding:', error);
    res.status(500).json({ error: 'Failed to save onboarding data' });
  }
});

// ============================================
// 🔍 GET /api/agent/habits - Analyser les habitudes
// ============================================

router.get('/habits', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const analysis = await analyzeHabits(userId);

    res.json({
      analysis,
      summary: {
        total: analysis.length,
        strong: analysis.filter(a => a.classification === 'forte').length,
        inProgress: analysis.filter(a => a.classification === 'en progrès').length,
        fragile: analysis.filter(a => a.classification === 'fragile').length,
      },
    });
  } catch (error) {
    console.error('Error in /agent/habits:', error);
    res.status(500).json({ error: 'Failed to analyze habits' });
  }
});

// ============================================
// 📋 GET /api/agent/sessions - Historique des sessions
// ============================================

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const sessions = await prisma.coachSession.findMany({
      where: { userId },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        phase: true,
        status: true,
        topic: true,
        wisdomGained: true,
        startedAt: true,
        endedAt: true,
        updatedAt: true,
      },
    });

    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error in /agent/sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ============================================
// 🚀 GET /api/agent/onboarding - Récupérer le flow d'onboarding
// ============================================

router.get('/onboarding', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const onboarding = await getOnboarding(userId);

    res.json(onboarding);
  } catch (error) {
    console.error('Error in /agent/onboarding:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding' });
  }
});

// ============================================
// 🔄 PATCH /api/agent/phase - Changer de phase
// ============================================

router.patch('/phase', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { phase } = req.body;

    if (!phase || phase < 1 || phase > 4) {
      return res.status(400).json({ error: 'Phase must be between 1 and 4' });
    }

    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentPhase: phase,
      },
      update: {
        currentPhase: phase,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error in /agent/phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

export default router;
