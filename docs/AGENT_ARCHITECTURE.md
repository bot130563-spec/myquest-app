# MyQuest AI Coach Agent — Architecture

## Vision
Chaque utilisateur a son propre agent coach de vie personnalisé. L'agent :
- Connaît l'historique complet de l'utilisateur (habitudes, journal, quêtes, stats)
- A une mémoire persistante par utilisateur (sessions passées, insights, phases)
- Évolue et s'adapte au profil unique de chaque personne
- Fonctionne de manière indépendante (standalone API, pas lié à OpenClaw)

## Architecture technique

```
┌─────────────────────────────────────────┐
│           MyQuest Frontend              │
│  (React Native / Expo)                  │
│                                         │
│  CoachScreen ←→ REST API ←→ Agent Core  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        Agent API (Node.js/Express)      │
│                                         │
│  POST /agent/chat                       │
│  POST /agent/analyze-habits             │
│  GET  /agent/profile/:userId            │
│  POST /agent/onboarding                 │
│  GET  /agent/recommendations            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           Agent Core Engine             │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  Context Builder                  │   │
│  │  - Charge les données utilisateur│   │
│  │  - Construit le prompt contexte  │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │  Prompt Engine                    │   │
│  │  - System prompt expert           │   │
│  │  - Sélection de phase             │   │
│  │  - Injection du contexte user    │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │  LLM Provider (interchangeable)   │   │
│  │  - Claude API (Anthropic)         │   │
│  │  - GPT-4 (OpenAI)                │   │
│  │  - Gemini (Google)               │   │
│  │  - Open source (Llama, Mistral)  │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │  Memory Manager                   │   │
│  │  - Session history (conversations)│   │
│  │  - User profile (insights, phase)│   │
│  │  - Habit patterns (analytics)    │   │
│  │  - Coach notes (observations)    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Modèle de données Agent

### UserCoachProfile (nouveau modèle Prisma)
```prisma
model CoachProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  // Phase actuelle du coaching
  currentPhase  Int      @default(1)  // 1-4
  
  // Introspection
  values        Json?    // Valeurs identifiées
  strengths     Json?    // Forces naturelles
  beliefs       Json?    // Croyances limitantes
  
  // Vision
  vision3m      String?  // Vision 3 mois
  vision1y      String?  // Vision 1 an
  vision5y      String?  // Vision 5 ans
  ikigai        Json?    // Résultat ikigai
  
  // Habitudes (analyse Atomic Habits)
  habitPatterns Json?    // Patterns détectés
  keyHabits     Json?    // 3 habitudes clés identifiées
  
  // Historique coach
  totalSessions Int      @default(0)
  lastSessionAt DateTime?
  coachNotes    Json?    // Notes accumulées par le coach
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CoachSession {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  
  phase      Int      // Phase abordée
  messages   Json     // Historique des messages
  insights   Json?    // Insights de la session
  actions    Json?    // Actions définies
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## System Prompt Structure

Le system prompt est composé dynamiquement :

```
[BASE] Expert coaching prompt (fixe)
  +
[PHASE] Instructions spécifiques à la phase actuelle
  +
[CONTEXT] Données utilisateur injectées :
  - Habitudes + streaks (7 derniers jours)
  - Journal récent (3 dernières entrées)
  - Stats actuelles
  - Quêtes actives
  - Profil coach (valeurs, vision, patterns)
  - Notes des sessions précédentes
  +
[HISTORY] Derniers 10 messages de la conversation
```

## Onboarding Flow (première utilisation)

1. **Welcome** : Présentation du coach, explication du parcours
2. **Wheel of Life** : Évaluation rapide de 8 domaines (1-10)
   - Santé, Relations, Carrière, Finances, Fun, Croissance, Environnement, Contribution
3. **Valeurs** : "Choisis 5 valeurs parmi cette liste" + "Classe-les par importance"
4. **Vision rapide** : "Si tout était possible, qui serais-tu dans 5 ans ?"
5. **Premier objectif** : Transformer la vision en une première habitude (règle des 2 min)

## Scalabilité

- Chaque utilisateur a son propre CoachProfile
- L'historique conversationnel est limité aux 10 derniers messages (window)
- Les insights et notes sont résumés périodiquement (compression)
- Le LLM provider est interchangeable (API key par utilisateur possible)
- Rate limiting par utilisateur (ex: 20 messages/jour sur plan gratuit)

## Coûts estimés par utilisateur

| Usage | Tokens/msg | Coût/msg (Claude Haiku) | Coût/mois (20 msg/j) |
|-------|-----------|------------------------|---------------------|
| Léger | ~2000 | ~$0.0005 | ~$0.30 |
| Moyen | ~4000 | ~$0.001 | ~$0.60 |
| Intensif | ~8000 | ~$0.002 | ~$1.20 |

→ Viable même en freemium avec 20 messages/jour gratuits.
