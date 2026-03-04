/**
 * ==========================================
 * 🤖 COACH ENGINE - Agent de coaching (V2 compatible)
 * ==========================================
 *
 * Ce module implémente le moteur de l'agent coach de vie.
 * Mis à jour pour les 7 dimensions et le schema Coach V2.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ============================================
// 📦 TYPES
// ============================================

interface UserContext {
  user: {
    name: string | null;
    level: number;
    experience: number;
  };
  habits: Array<{
    title: string;
    streakCount: number;
    lastCompletedAt: Date | null;
    category: string;
  }>;
  journal: Array<{
    date: Date;
    mood: number;
    content: string | null;
  }>;
  stats: {
    body: number;
    mind: number;
    wisdom: number;
    social: number;
    love: number;
    career: number;
    finance: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
  quests: Array<{
    title: string;
    status: string;
    dueDate: Date | null;
  }>;
  profile: {
    currentPhase: number;
    values: any;
    strengths: any;
    shadows: any;
    chaosOrder: any;
    vision: any;
    summary: string | null;
    onboardingDone: boolean;
  } | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  sessionId: string;
}

interface HabitAnalysis {
  habit: string;
  consistency: number;
  classification: 'forte' | 'en progrès' | 'fragile';
  recommendations: string[];
}

// ============================================
// 🔧 FONCTIONS PRINCIPALES
// ============================================

/**
 * Construit le contexte complet de l'utilisateur
 * pour alimenter le system prompt
 */
export async function buildContext(userId: string): Promise<UserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      avatar: true,
      stats: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    select: {
      title: true,
      streakCount: true,
      lastCompletedAt: true,
      category: true,
    },
    orderBy: { streakCount: 'desc' },
  });

  const journal = await prisma.journalEntry.findMany({
    where: { userId },
    select: { entryDate: true, mood: true, content: true },
    orderBy: { entryDate: 'desc' },
    take: 5,
  });

  const quests = await prisma.quest.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { title: true, status: true, dueDate: true },
  });

  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
  });

  return {
    user: {
      name: user.name,
      level: user.avatar?.level || 1,
      experience: user.avatar?.experience || 0,
    },
    habits: habits.map(h => ({
      title: h.title,
      streakCount: h.streakCount,
      lastCompletedAt: h.lastCompletedAt,
      category: h.category,
    })),
    journal: journal.map(j => ({
      date: j.entryDate,
      mood: j.mood,
      content: j.content,
    })),
    stats: user.stats ? {
      body: user.stats.body,
      mind: user.stats.mind,
      wisdom: user.stats.wisdom,
      social: user.stats.social,
      love: user.stats.love,
      career: user.stats.career,
      finance: user.stats.finance,
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
    } : null,
    quests: quests.map(q => ({
      title: q.title,
      status: q.status,
      dueDate: q.dueDate,
    })),
    profile: profile ? {
      currentPhase: profile.currentPhase,
      values: profile.values,
      strengths: profile.strengths,
      shadows: profile.shadows,
      chaosOrder: profile.chaosOrder,
      vision: profile.vision,
      summary: profile.summary,
      onboardingDone: profile.onboardingDone,
    } : null,
  };
}

/**
 * Construit le system prompt avec le contexte utilisateur
 */
export function buildSystemPrompt(context: UserContext, phase: number): string {
  return `Tu es un coach de vie expert qui combine plusieurs approches éprouvées:
- Atomic Habits (James Clear) pour la transformation par les habitudes
- Maps of Meaning (Peterson) : chaos/ordre, archétype du héros
- Self-Authoring (Peterson) : écriture réflexive passé/présent/futur
- Logothérapie (Frankl) : le sens émerge de l'engagement
- Psychologie jungienne : ombre, individuation

## Ton rôle

Tu accompagnes l'utilisateur dans un parcours structuré en 4 phases:
1. CONNAISSANCE DE SOI - Explorer valeurs, forces, ombres
2. VISION ET AMBITIONS - Définir une vision claire
3. DIAGNOSTIC DES HABITUDES - Analyser et optimiser selon Atomic Habits
4. PLAN D'ACTION - Projets concrets issus de l'introspection

## Style de communication

- Pose des questions ouvertes, pas des directives
- Reformule pour approfondir la réflexion
- Valide l'émotion avant de proposer des solutions
- Utilise le "tu" et le prénom
- Jamais de jugement, mais challenge bienveillant
- Concis et actionnable

## Données de l'utilisateur

**Prénom:** ${context.user.name || 'Héros'}
**Niveau:** ${context.user.level}
**Phase actuelle:** ${phase}/4

### Habitudes actives
${context.habits.length > 0 ? context.habits.map(h =>
  `- ${h.title} — Streak: ${h.streakCount} jours (${h.category})`
).join('\n') : 'Aucune habitude active pour le moment.'}

### Journal récent
${context.journal.length > 0 ? context.journal.map(j =>
  `- ${j.date.toISOString().split('T')[0]}: Humeur ${j.mood}/5 — ${j.content ? j.content.substring(0, 100) + '...' : 'Pas de contenu'}`
).join('\n') : 'Aucune entrée de journal récente.'}

### Stats actuelles (7 dimensions)
${context.stats ? `Corps: ${context.stats.body}/100, Esprit: ${context.stats.mind}/100, Sagesse: ${context.stats.wisdom}/100, Social: ${context.stats.social}/100, Amour: ${context.stats.love}/100, Carrière: ${context.stats.career}/100, Finances: ${context.stats.finance}/100
Streak actuel: ${context.stats.currentStreak} jour(s), Record: ${context.stats.longestStreak}` : 'Stats non disponibles'}

### Quêtes actives
${context.quests.length > 0 ? context.quests.map(q =>
  `- ${q.title} ${q.dueDate ? `(échéance: ${q.dueDate.toISOString().split('T')[0]})` : ''}`
).join('\n') : 'Aucune quête active.'}

### Profil coaching
${context.profile ? `
Valeurs: ${context.profile.values ? JSON.stringify(context.profile.values) : 'Non définies'}
Forces: ${context.profile.strengths ? JSON.stringify(context.profile.strengths) : 'Non définies'}
Ombres: ${context.profile.shadows ? JSON.stringify(context.profile.shadows) : 'Non explorées'}
Rapport chaos/ordre: ${context.profile.chaosOrder ? JSON.stringify(context.profile.chaosOrder) : 'Non défini'}
Vision: ${context.profile.vision ? JSON.stringify(context.profile.vision) : 'Non définie'}
Résumé: ${context.profile.summary || 'Aucun résumé'}
Onboarding: ${context.profile.onboardingDone ? 'Complété' : 'En cours'}
` : 'Profil coaching non initialisé — première session.'}

## Ta mission actuelle

${getPhaseInstructions(phase)}`;
}

/**
 * Instructions spécifiques à chaque phase
 */
function getPhaseInstructions(phase: number): string {
  switch (phase) {
    case 1:
      return `Phase 1 - CONNAISSANCE DE SOI

Tu aides l'utilisateur à explorer:
- Ses valeurs profondes (qu'est-ce qui compte vraiment?)
- Ses forces naturelles et talents
- Ses zones d'ombre (faiblesses reconnues, patterns à transformer)
- Son rapport chaos/ordre (Maps of Meaning)

Pose des questions qui invitent à la réflexion. Évite les réponses toutes faites.`;

    case 2:
      return `Phase 2 - VISION ET AMBITIONS

Tu aides l'utilisateur à construire une vision claire:
- Qui veut-il devenir dans 5 ans?
- Quel pont entre le moi actuel et le moi idéal?
- Quelles dimensions de vie prioriser?

Utilise l'approche Self-Authoring de Peterson.`;

    case 3:
      return `Phase 3 - DIAGNOSTIC DES HABITUDES

Analyse les habitudes selon les 4 lois d'Atomic Habits:
1. Rendre évident (cues clairs)
2. Rendre attrayant (motivation)
3. Rendre facile (règle des 2 min)
4. Rendre satisfaisant (récompenses)

Identifie les patterns de succès et les points de friction.`;

    case 4:
      return `Phase 4 - PLAN D'ACTION ET PROJETS

Aide l'utilisateur à:
- Transformer les insights en projets concrets
- Types de projets : remédiation, amplification, alignement, confrontation, vision
- Chaque projet impacte les 7 dimensions de vie
- Créer des systèmes (pas juste des objectifs)

Focus sur l'amélioration continue de 1% par jour.`;

    default:
      return 'Phase inconnue. Aide l\'utilisateur selon son besoin actuel.';
  }
}

/**
 * Appelle le LLM (Claude ou mock intelligent)
 */
async function callLLM(systemPrompt: string, messages: Message[]): Promise<string> {
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
        }),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('Anthropic API error:', data);
        throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
      }

      return data.content[0].text as string;
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      return generateMockResponse(systemPrompt, messages);
    }
  } else {
    return generateMockResponse(systemPrompt, messages);
  }
}

/**
 * Génère une réponse mock intelligente basée sur le contexte
 */
function generateMockResponse(_systemPrompt: string, messages: Message[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userMessage = lastUserMessage?.content.toLowerCase() || '';

  if (userMessage.includes('bonjour') || userMessage.includes('salut') || messages.length === 1) {
    return `Bonjour ! 👋 Je suis ravi de t'accompagner dans ton parcours de développement personnel.

Comment te sens-tu aujourd'hui ? Qu'est-ce qui t'amène à me parler ?`;
  }

  if (userMessage.includes('valeur') || userMessage.includes('important')) {
    return `Excellente question ! Les valeurs sont le fondement de qui tu es.

Prends un moment pour réfléchir: quand tu te sens vraiment aligné et épanoui, quelles sont les choses qui sont présentes dans ta vie?

Nomme-moi 2-3 choses qui te viennent spontanément à l'esprit.`;
  }

  if (userMessage.includes('habitude') || userMessage.includes('streak')) {
    return `La clé du succès avec les habitudes, c'est de les rendre:
1. **Évidentes** - Un signal clair déclenche l'action
2. **Attrayantes** - Tu dois avoir envie de les faire
3. **Faciles** - Règle des 2 minutes pour commencer
4. **Satisfaisantes** - Récompense immédiate

Quelle est l'habitude qui te pose le plus de difficultés en ce moment?`;
  }

  if (userMessage.includes('vision') || userMessage.includes('futur') || userMessage.includes('objectif')) {
    return `Imagine-toi dans 5 ans, vivant ta meilleure vie. Où es-tu? Que fais-tu? Qui t'entoure?

Raconte-moi cette vision, même si elle te semble un peu folle!`;
  }

  return `Merci de partager ça avec moi! 🙏

${userMessage.length < 20 ?
    'Peux-tu développer un peu plus ta pensée?' :
    'Qu\'est-ce que ça représente pour toi concrètement?'}

N'hésite pas à être aussi précis que possible.`;
}

/**
 * Gère une conversation avec le coach (V2 — utilise CoachMessage)
 */
export async function chat(
  userId: string,
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  let session;

  if (sessionId) {
    session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or unauthorized');
    }
  } else {
    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    });
    const currentPhase = profile?.currentPhase || 1;

    session = await prisma.coachSession.create({
      data: {
        userId,
        phase: currentPhase,
        status: 'active',
      },
      include: { messages: true },
    });
  }

  // Stocker le message utilisateur
  await prisma.coachMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: message,
    },
  });

  // Construire les messages pour le LLM à partir des CoachMessages
  const existingMessages: Message[] = (session.messages || [])
    .filter((m: any) => m.role === 'user' || m.role === 'coach')
    .map((m: any) => ({
      role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));
  existingMessages.push({ role: 'user', content: message });

  // Construire le contexte et le system prompt
  const context = await buildContext(userId);
  const systemPrompt = buildSystemPrompt(context, session.phase);

  // Appeler le LLM
  const assistantMessage = await callLLM(systemPrompt, existingMessages);

  // Stocker la réponse du coach
  await prisma.coachMessage.create({
    data: {
      sessionId: session.id,
      role: 'coach',
      content: assistantMessage,
    },
  });

  return {
    message: assistantMessage,
    sessionId: session.id,
  };
}

/**
 * Analyse les habitudes selon Atomic Habits
 */
export async function analyzeHabits(userId: string): Promise<HabitAnalysis[]> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        where: {
          completedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  const analyses: HabitAnalysis[] = [];

  for (const habit of habits) {
    const daysInPeriod = 30;
    const completionCount = habit.logs.length;
    const consistency = Math.round((completionCount / daysInPeriod) * 100);

    let classification: 'forte' | 'en progrès' | 'fragile';
    if (consistency >= 70) classification = 'forte';
    else if (consistency >= 40) classification = 'en progrès';
    else classification = 'fragile';

    const recommendations: string[] = [];

    if (consistency < 70) {
      if (consistency < 40) {
        recommendations.push('1. RENDRE ÉVIDENT: Ajoute un rappel visuel à un endroit stratégique');
        recommendations.push('2. RENDRE FACILE: Réduis cette habitude à sa version "2 minutes"');
      }
      recommendations.push('3. RENDRE ATTRAYANT: Associe cette habitude à quelque chose que tu aimes');
      recommendations.push('4. RENDRE SATISFAISANT: Célèbre chaque complétion');
    } else {
      recommendations.push('✅ Excellente consistance! Augmente graduellement la difficulté.');
    }

    analyses.push({
      habit: habit.title,
      consistency,
      classification,
      recommendations,
    });
  }

  return analyses;
}

/**
 * Retourne le flow d'onboarding V2
 */
export async function getOnboarding(userId: string) {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
  });

  if (profile?.onboardingDone) {
    return {
      completed: true,
      profile,
    };
  }

  // Flow d'onboarding V2 : 6 questions
  return {
    completed: false,
    steps: [
      {
        id: 'q1',
        zone: 'values',
        question: 'Pense à un moment récent où tu t\'es senti vraiment vivant. Que faisais-tu ?',
      },
      {
        id: 'q2',
        zone: 'values',
        question: 'Qu\'est-ce qui te met en colère quand tu le vois dans le monde ?',
      },
      {
        id: 'q3',
        zone: 'strengths',
        question: 'Dans quoi les gens viennent-ils te demander de l\'aide ?',
      },
      {
        id: 'q4',
        zone: 'shadows',
        question: 'Quel trait de caractère tu sais que tu devrais changer, mais que tu repousses ?',
      },
      {
        id: 'q5',
        zone: 'chaosOrder',
        question: 'Face à l\'inconnu, ta première réaction : fuir, réfléchir, ou foncer ?',
      },
      {
        id: 'q6',
        zone: 'vision',
        question: 'Imagine-toi dans 5 ans, ta meilleure version. Décris cette scène.',
      },
    ],
  };
}

export default {
  buildContext,
  buildSystemPrompt,
  chat,
  analyzeHabits,
  getOnboarding,
};
