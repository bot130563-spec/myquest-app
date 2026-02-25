/**
 * ==========================================
 * 🤖 COACH ENGINE - Agent de coaching indépendant
 * ==========================================
 *
 * Ce module implémente le moteur de l'agent coach de vie.
 * Il construit le contexte utilisateur, génère des system prompts dynamiques,
 * et gère les conversations avec le LLM.
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
    health: number;
    energy: number;
    wisdom: number;
    social: number;
    wealth: number;
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
    vision1y: string | null;
    coachNotes: any;
    wheelOfLife: any;
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
  // Charger les données utilisateur
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

  // Charger les habitudes actives
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      title: true,
      streakCount: true,
      lastCompletedAt: true,
      category: true,
    },
    orderBy: {
      streakCount: 'desc',
    },
  });

  // Charger les 5 dernières entrées de journal
  const journal = await prisma.journalEntry.findMany({
    where: { userId },
    select: {
      entryDate: true,
      mood: true,
      content: true,
    },
    orderBy: {
      entryDate: 'desc',
    },
    take: 5,
  });

  // Charger les quêtes actives
  const quests = await prisma.quest.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    select: {
      title: true,
      status: true,
      dueDate: true,
    },
  });

  // Charger le profil coach (ou null si pas encore créé)
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
      health: user.stats.health,
      energy: user.stats.energy,
      wisdom: user.stats.wisdom,
      social: user.stats.social,
      wealth: user.stats.wealth,
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
      vision1y: profile.vision1y,
      coachNotes: profile.coachNotes,
      wheelOfLife: profile.wheelOfLife,
    } : null,
  };
}

/**
 * Construit le system prompt avec le contexte utilisateur
 */
export function buildSystemPrompt(context: UserContext, phase: number): string {
  const basePrompt = `Tu es un coach de vie expert qui combine plusieurs approches éprouvées:
- Atomic Habits (James Clear) pour la transformation par les habitudes
- Introspection structurée pour la connaissance de soi
- Ikigai pour la définition du sens et de la vision
- Wheel of Life pour l'équilibre des domaines de vie
- Psychologie positive (PERMA) pour le bien-être durable

## Ton rôle

Tu accompagnes l'utilisateur dans un parcours structuré en 4 phases:
1. CONNAISSANCE DE SOI - Explorer valeurs, forces, croyances
2. VISION ET AMBITIONS - Définir une vision à 3 mois, 1 an, 5 ans
3. DIAGNOSTIC DES HABITUDES - Analyser et optimiser selon Atomic Habits
4. PLAN D'ACTION - Définir 3 habitudes clés et suivre les progrès

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

### Stats actuelles
${context.stats ? `Santé: ${context.stats.health}/100, Énergie: ${context.stats.energy}/100, Sagesse: ${context.stats.wisdom}/100, Social: ${context.stats.social}/100, Finances: ${context.stats.wealth}/100
Streak actuel: ${context.stats.currentStreak} jour(s), Record: ${context.stats.longestStreak}` : 'Stats non disponibles'}

### Quêtes actives
${context.quests.length > 0 ? context.quests.map(q =>
  `- ${q.title} ${q.dueDate ? `(échéance: ${q.dueDate.toISOString().split('T')[0]})` : ''}`
).join('\n') : 'Aucune quête active.'}

### Profil coaching
${context.profile ? `
Valeurs identifiées: ${context.profile.values ? JSON.stringify(context.profile.values) : 'Non définies'}
Vision 1 an: ${context.profile.vision1y || 'Non définie'}
Wheel of Life: ${context.profile.wheelOfLife ? JSON.stringify(context.profile.wheelOfLife) : 'Non remplie'}
Notes précédentes: ${context.profile.coachNotes ? JSON.stringify(context.profile.coachNotes).substring(0, 200) : 'Aucune'}
` : 'Profil coaching non initialisé — première session.'}

## Ta mission actuelle

${getPhaseInstructions(phase)}`;

  return basePrompt;
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
- Ses croyances limitantes et ressources
- Ses patterns émotionnels

Pose des questions qui invitent à la réflexion. Évite les réponses toutes faites.`;

    case 2:
      return `Phase 2 - VISION ET AMBITIONS

Tu aides l'utilisateur à construire une vision claire:
- Vision 3 mois: objectifs concrets et mesurables
- Vision 1 an: transformation souhaitée
- Vision 5 ans: la personne qu'il veut devenir

Utilise l'ikigai pour explorer l'intersection passion/mission/vocation/profession.`;

    case 3:
      return `Phase 3 - DIAGNOSTIC DES HABITUDES

Analyse les habitudes selon les 4 lois d'Atomic Habits:
1. Rendre évident (cues clairs)
2. Rendre attrayant (motivation)
3. Rendre facile (règle des 2 min)
4. Rendre satisfaisant (récompenses)

Identifie les patterns de succès et les points de friction.`;

    case 4:
      return `Phase 4 - PLAN D'ACTION

Aide l'utilisateur à:
- Définir 3 habitudes clés alignées sur sa vision
- Créer des systèmes (pas juste des objectifs)
- Suivre les progrès et ajuster
- Célébrer les victoires

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
          model: 'claude-3-haiku-20240307',
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
      // Fallback au mock en cas d'erreur
      return generateMockResponse(systemPrompt, messages);
    }
  } else {
    // Mode mock intelligent
    return generateMockResponse(systemPrompt, messages);
  }
}

/**
 * Génère une réponse mock intelligente basée sur le contexte
 */
function generateMockResponse(systemPrompt: string, messages: Message[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userMessage = lastUserMessage?.content.toLowerCase() || '';

  // Détecte les patterns dans le message utilisateur
  if (userMessage.includes('bonjour') || userMessage.includes('salut') || messages.length === 1) {
    return `Bonjour ! 👋 Je suis ravi de t'accompagner dans ton parcours de développement personnel.

Je vois que tu es actuellement en phase ${systemPrompt.includes('Phase 1') ? '1 (Connaissance de soi)' : systemPrompt.includes('Phase 2') ? '2 (Vision)' : systemPrompt.includes('Phase 3') ? '3 (Habitudes)' : '4 (Action)'}.

Comment te sens-tu aujourd'hui ? Qu'est-ce qui t'amène à me parler ?`;
  }

  if (userMessage.includes('valeur') || userMessage.includes('important')) {
    return `Excellente question ! Les valeurs sont le fondement de qui tu es.

Prends un moment pour réfléchir: quand tu te sens vraiment aligné et épanoui, quelles sont les choses qui sont présentes dans ta vie?

Est-ce la liberté? L'authenticité? L'impact sur les autres? La créativité? Le défi?

Nomme-moi 2-3 choses qui te viennent spontanément à l'esprit.`;
  }

  if (userMessage.includes('habitude') || userMessage.includes('streak')) {
    return `Je vois que tu as quelques habitudes en cours. C'est super! 💪

La clé du succès avec les habitudes, c'est de les rendre:
1. **Évidentes** - Un signal clair déclenche l'action
2. **Attrayantes** - Tu dois avoir envie de les faire
3. **Faciles** - Règle des 2 minutes pour commencer
4. **Satisfaisantes** - Récompense immédiate

Quelle est l'habitude qui te pose le plus de difficultés en ce moment?`;
  }

  if (userMessage.includes('vision') || userMessage.includes('futur') || userMessage.includes('objectif')) {
    return `Parlons de ta vision! 🎯

Imagine-toi dans 1 an. Tout s'est super bien passé. Tu es devenu la meilleure version de toi-même.

- Qu'est-ce qui a changé dans ta vie?
- Qu'est-ce que tu fais différemment?
- Comment te sens-tu?

Raconte-moi cette vision, même si elle te semble un peu folle!`;
  }

  if (userMessage.includes('difficulté') || userMessage.includes('problème') || userMessage.includes('bloqué')) {
    return `Je comprends que tu rencontres des difficultés. C'est normal, et c'est même un signe que tu pousses tes limites! 💪

Essayons de décortiquer ça ensemble:
- Quel est exactement le défi que tu rencontres?
- Qu'est-ce que tu as déjà essayé?
- Y a-t-il eu des moments où c'était plus facile? Qu'est-ce qui était différent?

Parle-moi de ce qui te bloque le plus.`;
  }

  // Réponse générique encourageante
  return `Merci de partager ça avec moi! 🙏

Ce que tu dis est intéressant. Pour t'aider au mieux, j'aimerais creuser un peu plus:

${userMessage.length < 20 ?
  'Peux-tu développer un peu plus ta pensée? Qu\'est-ce qui te vient à l\'esprit quand tu penses à ça?' :
  'Qu\'est-ce que ça représente pour toi concrètement? Comment ça se manifeste dans ton quotidien?'}

N'hésite pas à être aussi précis que possible. Plus j'en sais, mieux je peux t'accompagner!`;
}

/**
 * Gère une conversation avec le coach
 */
export async function chat(
  userId: string,
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  // Charger ou créer la session
  let session;

  if (sessionId) {
    session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or unauthorized');
    }
  } else {
    // Créer une nouvelle session
    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    });

    const currentPhase = profile?.currentPhase || 1;

    session = await prisma.coachSession.create({
      data: {
        userId,
        phase: currentPhase,
        messages: [],
      },
    });
  }

  // Récupérer l'historique des messages
  const messages: Message[] = Array.isArray(session.messages)
    ? (session.messages as any[]).map((m: any) => ({
        role: m.role,
        content: m.content,
      }))
    : [];
  messages.push({ role: 'user', content: message });

  // Construire le contexte et le system prompt
  const context = await buildContext(userId);
  const systemPrompt = buildSystemPrompt(context, session.phase);

  // Appeler le LLM
  const assistantMessage = await callLLM(systemPrompt, messages);

  // Sauvegarder la réponse
  messages.push({ role: 'assistant', content: assistantMessage });

  await prisma.coachSession.update({
    where: { id: session.id },
    data: {
      messages: messages as any,
      updatedAt: new Date(),
    },
  });

  // Mettre à jour le profil coach
  await prisma.coachProfile.upsert({
    where: { userId },
    create: {
      userId,
      currentPhase: 1,
      totalSessions: 1,
      lastSessionAt: new Date(),
    },
    update: {
      totalSessions: { increment: 1 },
      lastSessionAt: new Date(),
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
  // Récupérer toutes les habitudes de l'utilisateur
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        where: {
          completedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
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

    // Générer des recommandations basées sur les 4 lois d'Atomic Habits
    if (consistency < 70) {
      if (consistency < 40) {
        recommendations.push('1. RENDRE ÉVIDENT: Ajoute un rappel visuel à un endroit stratégique (post-it, alarme)');
        recommendations.push('2. RENDRE FACILE: Réduis cette habitude à sa version "2 minutes" pour faciliter le démarrage');
      }
      recommendations.push('3. RENDRE ATTRAYANT: Associe cette habitude à quelque chose que tu aimes déjà (habit stacking)');
      recommendations.push('4. RENDRE SATISFAISANT: Célèbre chaque complétion avec un petit rituel de victoire');
    } else {
      recommendations.push('✅ Excellente consistance! Continue ainsi et augmente graduellement la difficulté.');
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
 * Retourne le flow d'onboarding
 */
export async function getOnboarding(userId: string) {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
  });

  // Si profil existe et onboarding terminé, retourner les données
  if (profile && profile.wheelOfLife) {
    return {
      completed: true,
      profile,
    };
  }

  // Sinon, retourner le flow d'onboarding
  return {
    completed: false,
    steps: [
      {
        id: 'wheel-of-life',
        title: 'Wheel of Life',
        description: 'Évalue chaque domaine de ta vie sur une échelle de 1 à 10',
        domains: [
          'Santé & Forme physique',
          'Relations & Amour',
          'Carrière & Mission',
          'Finances & Sécurité',
          'Fun & Loisirs',
          'Croissance personnelle',
          'Environnement physique',
          'Contribution & Impact',
        ],
      },
      {
        id: 'values',
        title: 'Tes valeurs',
        description: 'Choisis 5 valeurs qui résonnent le plus avec toi',
        values: [
          'Authenticité', 'Liberté', 'Créativité', 'Famille', 'Succès',
          'Aventure', 'Sécurité', 'Croissance', 'Impact', 'Plaisir',
          'Indépendance', 'Connexion', 'Excellence', 'Équilibre', 'Courage',
          'Sagesse', 'Santé', 'Beauté', 'Joie', 'Paix',
          'Discipline', 'Compassion', 'Innovation', 'Tradition', 'Pouvoir',
          'Simplicité', 'Diversité', 'Justice', 'Gratitude', 'Curiosité',
        ],
      },
      {
        id: 'vision',
        title: 'Ta vision',
        description: 'Réponds à ces 3 questions pour définir ta vision',
        questions: [
          'Si tu avais une baguette magique et que tout était possible, qui serais-tu dans 5 ans?',
          'Quelles sont les 3 choses que tu veux absolument accomplir dans l\'année qui vient?',
          'Qu\'est-ce qui te donne de l\'énergie et du sens au quotidien?',
        ],
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
