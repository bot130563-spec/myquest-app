/**
 * ==========================================
 * 🤖 ROUTES COACH V2 — 7 dimensions, LLM, projets
 * ==========================================
 *
 * Endpoints :
 * - POST /coach/onboarding      — Questionnaire 6 questions → profil initial via LLM
 * - GET  /coach/dashboard       — Vue d'ensemble profil + zones + projets
 * - POST /coach/session/start   — Créer ou reprendre une session
 * - POST /coach/session/:id/message — Envoyer un message au coach
 * - POST /coach/session/:id/pause  — Mettre en pause la session
 * - GET  /coach/profile         — Profil complet
 * - POST /coach/project/:id/validate — Valider une proposition → créer Quest
 * - POST /coach/project/:id/reject  — Rejeter une proposition
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Client Anthropic (initialisé si la clé est présente)
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const COACH_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;
const TEMPERATURE = 0.7;

// ============================================
// 📦 TYPES
// ============================================

interface OnboardingAnswer {
  question: string;
  answer: string;
  zone: string; // values | strengths | shadows | chaosOrder | vision
}

// Réponse structurée du LLM
interface CoachLLMResponse {
  reply: string;
  insightScore: number;
  zone: string | null;
  profileUpdate: {
    field: string;
    value: any;
  } | null;
  unclearZoneUpdate: {
    zone: string;
    clarity: number;
  } | null;
  projectProposal: {
    step: string;
    title?: string;
    description?: string;
    why?: string;
    type?: string;
    statsImpact?: Record<string, number>;
  } | null;
}

// ============================================
// 🧠 SYSTEM PROMPT DU COACH
// ============================================

function buildCoachSystemPrompt(
  profileSnapshot: any,
  unclearZones: any,
  sessionMessages: string
): string {
  return `Tu es le Coach MyQuest, un expert en développement personnel.

## Tes fondations théoriques
- Maps of Meaning (Peterson) : chaos/ordre, archétype du héros, confrontation volontaire de l'inconnu
- Self-Authoring (Peterson) : écriture réflexive passé/présent/futur
- Atomic Habits (James Clear) : les 4 lois, identité d'abord, règle des 2 minutes
- Logothérapie (Frankl) : le sens émerge de l'engagement, pas de la recherche du plaisir
- Psychologie jungienne : ombre, individuation, persona vs authenticité

## Ton rôle
1. Guider l'utilisateur dans une introspection structurée
2. Détecter les zones floues de son profil et les approfondir
3. Quand le profil est assez clair, proposer des PROJETS concrets via un dialogue collaboratif

## Ce que tu sais de l'utilisateur
${profileSnapshot ? JSON.stringify(profileSnapshot, null, 2) : 'Profil non encore créé.'}

## Zones floues à explorer (priorité)
${unclearZones ? JSON.stringify(unclearZones, null, 2) : 'Aucune zone floue identifiée.'}

## Historique de la session en cours
${sessionMessages || 'Début de session.'}

## Les 7 dimensions de vie
Corps (💪), Esprit (🧠), Sagesse (📚), Social (👥), Amour (❤️), Carrière (🎯), Finances (💰)
Tu dois construire une vision GLOBALE de l'utilisateur sur ces 7 dimensions pour proposer des projets pertinents, réalistes, adaptés et évolutifs.

## Règles d'interaction
1. UNE question à la fois, jamais de liste
2. Reformuler ce que l'utilisateur dit avant de creuser
3. Valider l'émotion avant de challenger
4. Jamais de jugement — challenge bienveillant uniquement
5. Utiliser le prénom de l'utilisateur
6. Être fluide et humain — pas de structure rigide visible
7. Cibler les zones floues en priorité
8. Amour (❤️) : n'aborder que si l'utilisateur en parle de lui-même

## Limites (STRICTES)
- Tu es un coach de développement personnel, PAS un thérapeute
- JAMAIS de diagnostic (dépression, anxiété, trauma, trouble)
- Si détresse importante : valider l'émotion → rappeler que tu n'es pas un professionnel de santé → suggérer de consulter un psy/thérapeute → proposer de continuer sur un autre sujet
- JAMAIS de prescription (médicaments, régimes, traitements)
- Ne JAMAIS pousser l'utilisateur au-delà de ce qu'il est prêt à explorer

## Règles pour les projets
- Ne proposer un projet que quand l'insight est mûre (pas trop tôt)
- Suivre le flow : observation → exploration → diagnostic → proposition → co-construction → validation
- Toujours expliquer le POURQUOI (lien avec le profil)
- Classer le projet : remediation | amplification | alignment | confrontation | vision
- Ne jamais imposer — toujours demander validation

## Format de réponse (JSON strict)
Tu dois TOUJOURS répondre avec un JSON valide, sans texte autour. Pas de markdown, pas de backticks, juste le JSON :
{
  "reply": "Ton message au format naturel conversationnel",
  "insightScore": 0,
  "zone": null,
  "profileUpdate": null,
  "unclearZoneUpdate": null,
  "projectProposal": null
}

Champs optionnels quand pertinent :
- insightScore: 0-10 (profondeur de la dernière réponse user, 0 si premier message)
- zone: "values"|"strengths"|"shadows"|"chaosOrder"|"vision"|null
- profileUpdate: {"field": "values|strengths|shadows|chaosOrder|vision|summary", "value": {...}}
- unclearZoneUpdate: {"zone": "string", "clarity": 0.0-1.0}
- projectProposal: {"step": "observation|exploration|diagnostic|proposition|co-construction|validation", "title": "...", "description": "...", "why": "...", "type": "remediation|amplification|alignment|confrontation|vision", "statsImpact": {"wisdom": 0, "body": 0, ...}}`;
}

// ============================================
// 🔧 FONCTIONS HELPER
// ============================================

/**
 * Appelle le LLM et parse la réponse JSON
 */
async function callCoachLLM(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<CoachLLMResponse> {
  if (!anthropic) {
    // Mode fallback sans clé API
    return {
      reply: "Le coach IA n'est pas encore configuré. Configurez ANTHROPIC_API_KEY pour activer le coaching intelligent.",
      insightScore: 0,
      zone: null,
      profileUpdate: null,
      unclearZoneUpdate: null,
      projectProposal: null,
    };
  }

  const response = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: messages,
  });

  // Extraire le texte de la réponse
  const textBlock = response.content.find(b => b.type === 'text');
  const rawText = textBlock ? textBlock.text : '';

  // Parser le JSON — le LLM peut inclure des backticks
  const jsonStr = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(jsonStr) as CoachLLMResponse;
  } catch {
    // Si le parsing échoue, retourner la réponse brute
    return {
      reply: rawText,
      insightScore: 0,
      zone: null,
      profileUpdate: null,
      unclearZoneUpdate: null,
      projectProposal: null,
    };
  }
}

/**
 * Met à jour la stat wisdom de l'utilisateur
 */
async function updateWisdom(userId: string, wisdomPoints: number): Promise<void> {
  if (wisdomPoints <= 0) return;

  await prisma.stats.update({
    where: { userId },
    data: {
      wisdom: { increment: Math.min(wisdomPoints, 100) },
    },
  });
}

/**
 * Applique une mise à jour du profil signalée par le LLM
 */
async function applyProfileUpdate(
  userId: string,
  update: CoachLLMResponse['profileUpdate']
): Promise<void> {
  if (!update) return;

  const { field, value } = update;
  const validFields = ['values', 'strengths', 'shadows', 'chaosOrder', 'vision', 'summary'];
  if (!validFields.includes(field)) return;

  await prisma.coachProfile.update({
    where: { userId },
    data: { [field]: field === 'summary' ? String(value) : value },
  });
}

/**
 * Met à jour les zones floues du profil
 */
async function applyUnclearZoneUpdate(
  userId: string,
  update: CoachLLMResponse['unclearZoneUpdate']
): Promise<void> {
  if (!update) return;

  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { unclearZones: true },
  });

  const zones: Array<{ zone: string; clarity: number; reason?: string }> =
    Array.isArray(profile?.unclearZones) ? (profile.unclearZones as any[]) : [];

  // Trouver et mettre à jour la zone ou l'ajouter
  const existingIndex = zones.findIndex(z => z.zone === update.zone);
  const oldClarity = existingIndex >= 0 ? zones[existingIndex].clarity : 0;

  if (existingIndex >= 0) {
    zones[existingIndex].clarity = update.clarity;
  } else {
    zones.push({ zone: update.zone, clarity: update.clarity });
  }

  await prisma.coachProfile.update({
    where: { userId },
    data: { unclearZones: zones },
  });

  // Bonus wisdom : quand une zone passe de floue (<0.5) à claire (>0.7)
  if (oldClarity < 0.5 && update.clarity > 0.7) {
    await updateWisdom(userId, 10);
  }
}

/**
 * Formate les messages d'une session pour le contexte LLM
 */
function formatSessionMessages(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n');
}

// ============================================
// 📝 POST /coach/onboarding
// ============================================
// Reçoit les 6 réponses d'onboarding, appelle le LLM pour générer le profil initial

router.post('/onboarding', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { answers } = req.body as { answers: OnboardingAnswer[] };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Les réponses sont requises' });
    }

    // Vérifier si l'onboarding est déjà fait
    const existingProfile = await prisma.coachProfile.findUnique({
      where: { userId },
    });
    if (existingProfile?.onboardingDone) {
      return res.status(400).json({ error: 'Onboarding déjà complété' });
    }

    // Créer une session d'onboarding
    const session = await prisma.coachSession.create({
      data: {
        userId,
        status: 'active',
        phase: 1,
        topic: 'onboarding',
      },
    });

    // Stocker les réponses en tant que CoachMessages
    for (const answer of answers) {
      // Question (system)
      await prisma.coachMessage.create({
        data: {
          sessionId: session.id,
          role: 'system',
          content: answer.question,
          zone: answer.zone,
        },
      });
      // Réponse (user)
      await prisma.coachMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: answer.answer,
          zone: answer.zone,
        },
      });
    }

    // Appeler le LLM pour générer le profil initial
    const onboardingPrompt = `L'utilisateur vient de compléter son questionnaire d'onboarding. Voici ses réponses :

${answers.map((a, i) => `Q${i + 1} [${a.zone}]: ${a.question}\nR: ${a.answer}`).join('\n\n')}

Analyse ces réponses et génère :
1. Un profil initial (values, strengths, shadows, chaosOrder, vision, summary)
2. Les zones floues (unclearZones) — ce qui est vague ou mérite d'être approfondi
3. Un premier message d'approfondissement naturel, basé sur la zone la plus floue

Réponds en JSON strict avec le format habituel. Le profileUpdate doit contenir les données initiales. Inclus aussi les unclearZones.

IMPORTANT : dans ta reply, enchaîne naturellement comme si tu venais de lire leurs réponses. Pas de "Bonjour", pas de formalisme. Sois chaleureux et direct.`;

    const llmResponse = await callCoachLLM(
      buildCoachSystemPrompt(null, null, ''),
      [{ role: 'user', content: onboardingPrompt }]
    );

    // Créer ou mettre à jour le profil
    const profileData: any = {
      onboardingDone: true,
      currentPhase: 1,
    };

    // Appliquer le profileUpdate du LLM s'il existe
    if (llmResponse.profileUpdate) {
      profileData[llmResponse.profileUpdate.field] = llmResponse.profileUpdate.value;
    }

    // Appliquer les unclearZones
    if (llmResponse.unclearZoneUpdate) {
      profileData.unclearZones = [llmResponse.unclearZoneUpdate];
    }

    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });

    // Stocker le message du coach
    await prisma.coachMessage.create({
      data: {
        sessionId: session.id,
        role: 'coach',
        content: llmResponse.reply,
      },
    });

    // Mettre à jour la session avec le snapshot du profil
    await prisma.coachSession.update({
      where: { id: session.id },
      data: { profileSnapshot: profile as any },
    });

    // Donner de la wisdom pour l'onboarding (+5)
    await updateWisdom(userId, 5);

    res.json({
      profile,
      sessionId: session.id,
      coachMessage: llmResponse.reply,
      unclearZones: profile.unclearZones,
    });
  } catch (error) {
    console.error('Erreur onboarding:', error);
    res.status(500).json({ error: 'Erreur lors de l\'onboarding' });
  }
});

// ============================================
// 📊 GET /coach/dashboard
// ============================================
// Retourne profil, avancement par zone, insights, projets proposés

router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const [profile, projects, lastSession, stats] = await Promise.all([
      prisma.coachProfile.findUnique({ where: { userId } }),
      prisma.coachProjectProposal.findMany({
        where: { userId, status: { in: ['proposed', 'discussing'] } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coachSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.stats.findUnique({ where: { userId }, select: { wisdom: true } }),
    ]);

    if (!profile) {
      return res.json({
        onboardingDone: false,
        message: 'Commence ton onboarding pour activer le coach.',
      });
    }

    // Calculer la clarté par zone
    const zones = ['values', 'strengths', 'shadows', 'chaosOrder', 'vision'];
    const unclearZones: Array<{ zone: string; clarity: number }> =
      Array.isArray(profile.unclearZones) ? (profile.unclearZones as any[]) : [];

    const zoneProgress = zones.map(zone => {
      const unclearEntry = unclearZones.find(z => z.zone === zone);
      // Si la zone est dans unclearZones, utiliser sa clarity, sinon vérifier si le champ est rempli
      const hasData = (profile as any)[zone] !== null && (profile as any)[zone] !== undefined;
      const clarity = unclearEntry ? unclearEntry.clarity : (hasData ? 0.8 : 0.0);
      return {
        zone,
        clarity: Math.round(clarity * 100),
        hasData,
      };
    });

    res.json({
      onboardingDone: profile.onboardingDone,
      profile: {
        summary: profile.summary,
        values: profile.values,
        strengths: profile.strengths,
        shadows: profile.shadows,
        chaosOrder: profile.chaosOrder,
        vision: profile.vision,
        currentPhase: profile.currentPhase,
      },
      zoneProgress,
      wisdom: stats?.wisdom || 50,
      projects,
      lastSession: lastSession
        ? {
            id: lastSession.id,
            status: lastSession.status,
            topic: lastSession.topic,
            wisdomGained: lastSession.wisdomGained,
            lastMessage: lastSession.messages[0]?.content || null,
            startedAt: lastSession.startedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du dashboard' });
  }
});

// ============================================
// 🚀 POST /coach/session/start
// ============================================
// Crée une nouvelle session ou reprend la dernière en pause

router.post('/session/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // Vérifier que l'onboarding est fait
    const profile = await prisma.coachProfile.findUnique({ where: { userId } });
    if (!profile?.onboardingDone) {
      return res.status(400).json({ error: 'Onboarding requis avant de démarrer une session' });
    }

    // Chercher une session active ou en pause
    let session = await prisma.coachSession.findFirst({
      where: { userId, status: { in: ['active', 'paused'] } },
      orderBy: { startedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (session) {
      // Reprendre la session
      if (session.status === 'paused') {
        await prisma.coachSession.update({
          where: { id: session.id },
          data: { status: 'active' },
        });
      }
    } else {
      // Créer une nouvelle session
      session = await prisma.coachSession.create({
        data: {
          userId,
          status: 'active',
          phase: profile.currentPhase,
          profileSnapshot: profile as any,
        },
        include: { messages: true },
      });
    }

    // Générer le message de reprise/démarrage
    const existingMessages = session.messages.map(m => ({
      role: m.role as string,
      content: m.content,
    }));

    const sessionContext = formatSessionMessages(existingMessages);

    const resumePrompt = existingMessages.length > 0
      ? 'La session reprend après une pause. Fais un bref rappel de ce dont vous parliez et relance naturellement la conversation.'
      : 'Nouvelle session. Salue l\'utilisateur et propose d\'explorer la zone la plus floue de son profil, ou continue l\'approfondissement.';

    const llmResponse = await callCoachLLM(
      buildCoachSystemPrompt(
        session.profileSnapshot || profile,
        profile.unclearZones,
        sessionContext
      ),
      [{ role: 'user', content: resumePrompt }]
    );

    // Stocker le message du coach
    await prisma.coachMessage.create({
      data: {
        sessionId: session.id,
        role: 'coach',
        content: llmResponse.reply,
      },
    });

    res.json({
      sessionId: session.id,
      coachMessage: llmResponse.reply,
      wisdomGained: session.wisdomGained,
      status: 'active',
    });
  } catch (error) {
    console.error('Erreur session start:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage de la session' });
  }
});

// ============================================
// 💬 POST /coach/session/:id/message
// ============================================
// Envoie un message au coach, reçoit la réponse

router.post('/session/:id/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.id;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Vérifier la session
    const session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session terminée' });
    }

    // Stocker le message utilisateur
    await prisma.coachMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Charger le profil pour le contexte
    const profile = await prisma.coachProfile.findUnique({ where: { userId } });

    // Construire les messages pour le LLM
    const allMessages = [
      ...session.messages.map(m => ({
        role: m.role === 'coach' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Filtrer pour le format LLM (user/assistant seulement)
    const llmMessages = allMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const sessionContext = formatSessionMessages(
      allMessages.map(m => ({ role: m.role, content: m.content }))
    );

    const llmResponse = await callCoachLLM(
      buildCoachSystemPrompt(
        session.profileSnapshot || profile,
        profile?.unclearZones,
        sessionContext
      ),
      llmMessages
    );

    // Stocker la réponse du coach avec les metadata
    await prisma.coachMessage.create({
      data: {
        sessionId,
        role: 'coach',
        content: llmResponse.reply,
        insightScore: llmResponse.insightScore || 0,
        zone: llmResponse.zone,
      },
    });

    // Calculer la wisdom gagnée
    const insightScore = llmResponse.insightScore || 0;
    const wisdomPoints = Math.floor(insightScore / 5);

    // Mettre à jour la session
    await prisma.coachSession.update({
      where: { id: sessionId },
      data: {
        wisdomGained: { increment: insightScore },
        topic: llmResponse.zone || session.topic,
      },
    });

    // Appliquer les updates du profil
    if (llmResponse.profileUpdate) {
      await applyProfileUpdate(userId, llmResponse.profileUpdate);
    }
    if (llmResponse.unclearZoneUpdate) {
      await applyUnclearZoneUpdate(userId, llmResponse.unclearZoneUpdate);
    }

    // Mettre à jour la wisdom
    await updateWisdom(userId, wisdomPoints);

    // Gérer la proposition de projet si présente
    let projectProposal = null;
    if (llmResponse.projectProposal && llmResponse.projectProposal.step === 'validation') {
      // Créer la proposition de projet en DB
      projectProposal = await prisma.coachProjectProposal.create({
        data: {
          userId,
          sessionId,
          title: llmResponse.projectProposal.title || 'Nouveau projet',
          description: llmResponse.projectProposal.description || '',
          why: llmResponse.projectProposal.why || '',
          type: llmResponse.projectProposal.type || 'alignment',
          statsImpact: llmResponse.projectProposal.statsImpact || {},
          status: 'proposed',
        },
      });
    }

    res.json({
      coachMessage: llmResponse.reply,
      insightScore,
      wisdomGained: wisdomPoints,
      zone: llmResponse.zone,
      projectProposal: projectProposal || llmResponse.projectProposal,
    });
  } catch (error) {
    console.error('Erreur message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

// ============================================
// ⏸️ POST /coach/session/:id/pause
// ============================================
// Met en pause la session (appelé auto quand l'utilisateur quitte)

router.post('/session/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.id;

    const session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (session.status !== 'active') {
      return res.json({ status: session.status, message: 'Session déjà en pause ou terminée' });
    }

    // Mettre en pause
    await prisma.coachSession.update({
      where: { id: sessionId },
      data: { status: 'paused' },
    });

    // Mettre à jour le profil avec les insights de la session
    const wisdomPoints = Math.floor(session.wisdomGained / 5);
    if (wisdomPoints > 0) {
      await updateWisdom(userId, wisdomPoints);
    }

    res.json({
      status: 'paused',
      wisdomGained: session.wisdomGained,
    });
  } catch (error) {
    console.error('Erreur pause:', error);
    res.status(500).json({ error: 'Erreur lors de la mise en pause' });
  }
});

// ============================================
// 👤 GET /coach/profile
// ============================================
// Retourne le profil complet + zones floues

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const [profile, stats, sessionCount] = await Promise.all([
      prisma.coachProfile.findUnique({ where: { userId } }),
      prisma.stats.findUnique({ where: { userId }, select: { wisdom: true } }),
      prisma.coachSession.count({ where: { userId } }),
    ]);

    if (!profile) {
      return res.json({
        exists: false,
        message: 'Aucun profil coach. Complète l\'onboarding pour commencer.',
      });
    }

    res.json({
      exists: true,
      profile: {
        ...profile,
        wisdom: stats?.wisdom || 50,
        totalSessions: sessionCount,
      },
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du profil' });
  }
});

// ============================================
// ✅ POST /coach/project/:id/validate
// ============================================
// Valide une proposition → crée un Quest

router.post('/project/:id/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const proposalId = req.params.id;

    const proposal = await prisma.coachProjectProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.userId !== userId) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    if (proposal.status === 'validated') {
      return res.status(400).json({ error: 'Proposition déjà validée' });
    }

    // Déterminer la catégorie de la quête selon le type et les stats impactées
    const statsImpact = (proposal.statsImpact as Record<string, number>) || {};
    let category: string = 'GENERAL';
    const impactEntries = Object.entries(statsImpact).sort((a, b) => b[1] - a[1]);
    if (impactEntries.length > 0) {
      const topStat = impactEntries[0][0];
      const statToCategory: Record<string, string> = {
        body: 'BODY', mind: 'MIND', wisdom: 'WISDOM',
        social: 'SOCIAL', love: 'LOVE', career: 'CAREER', finance: 'FINANCE',
      };
      category = statToCategory[topStat] || 'GENERAL';
    }

    // Créer la Quest
    const quest = await prisma.quest.create({
      data: {
        userId,
        title: proposal.title,
        description: `${proposal.description}\n\n**Pourquoi :** ${proposal.why}`,
        category: category as any,
        difficulty: 'HARD',
        xpReward: 50,
        statBoost: 5,
        status: 'ACTIVE',
      },
    });

    // Mettre à jour la proposition
    await prisma.coachProjectProposal.update({
      where: { id: proposalId },
      data: {
        status: 'validated',
        questId: quest.id,
      },
    });

    res.json({
      message: 'Projet validé et quête créée !',
      quest,
      proposal: { ...proposal, status: 'validated', questId: quest.id },
    });
  } catch (error) {
    console.error('Erreur validation projet:', error);
    res.status(500).json({ error: 'Erreur lors de la validation du projet' });
  }
});

// ============================================
// ❌ POST /coach/project/:id/reject
// ============================================
// Rejette une proposition

router.post('/project/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const proposalId = req.params.id;

    const proposal = await prisma.coachProjectProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.userId !== userId) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    await prisma.coachProjectProposal.update({
      where: { id: proposalId },
      data: { status: 'rejected' },
    });

    res.json({ message: 'Proposition rejetée', status: 'rejected' });
  } catch (error) {
    console.error('Erreur rejet projet:', error);
    res.status(500).json({ error: 'Erreur lors du rejet du projet' });
  }
});

export default router;
