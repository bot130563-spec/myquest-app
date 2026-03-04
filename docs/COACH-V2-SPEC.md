# Coach V2 — Spécification Technique

## Vision
Un coach structuré hybride : questionnaire rapide d'onboarding (5-6 questions) + approfondissement conversationnel via LLM. Le coach détecte les zones floues du profil et guide l'utilisateur vers plus de clarté. Chaque session d'introspection fait monter la stat **Sagesse**.

## Principes
1. **Mémoire persistante** — Les réponses sont stockées en DB. Le LLM les relit avant chaque interaction.
2. **Détection des zones d'ombre** — Le modèle analyse le profil et identifie ce qui est vague, contradictoire ou inexploré.
3. **Sessions flexibles** — L'utilisateur commence et arrête quand il veut. Le coach reprend là où on en était.
4. **Sagesse = introspection** — La stat `wisdom` augmente avec la profondeur et la quantité d'introspection.

---

## Architecture DB (nouvelles tables Prisma)

### CoachProfile
Stocke le profil synthétique généré par le LLM après analyse des réponses.

```prisma
model CoachProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // Profil synthétique (JSON généré par le LLM)
  values      Json?    // Valeurs dominantes identifiées
  strengths   Json?    // Forces naturelles
  shadows     Json?    // Zones d'ombre / faiblesses reconnues
  chaosOrder  Json?    // Rapport chaos/ordre
  vision      Json?    // Vision future
  summary     String?  // Portrait synthétique texte libre (par le LLM)
  
  // Tracking des zones floues
  unclearZones Json?   // [{zone: "values", clarity: 0.3, reason: "réponses vagues"}]
  
  // Phase actuelle du coaching
  currentPhase  Int    @default(1) // 1=connaissance, 2=vision, 3=habitudes, 4=action
  onboardingDone Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### CoachSession
Représente une session de coaching (start → stop).

```prisma
model CoachSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  status      String   @default("active") // active, paused, completed
  phase       Int      @default(1)
  topic       String?  // Sujet principal de la session
  
  // Sagesse gagnée dans cette session
  wisdomGained Int     @default(0)
  
  messages    CoachMessage[]
  
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  updatedAt   DateTime @updatedAt
}
```

### CoachMessage
Chaque message échangé avec le coach.

```prisma
model CoachMessage {
  id          String   @id @default(cuid())
  sessionId   String
  session     CoachSession @relation(fields: [sessionId], references: [id])
  
  role        String   // "user" | "coach" | "system"
  content     String
  
  // Metadata pour le scoring
  insightScore Int?    // 0-10, évalué par le LLM (profondeur de la réponse)
  zone        String?  // Quelle zone du profil cette réponse concerne
  
  createdAt   DateTime @default(now())
}
```

---

## Flow Utilisateur

### 1. Premier lancement (Onboarding)
1. L'utilisateur ouvre le Coach → écran d'intro expliquant le concept
2. **Questionnaire rapide** (6 questions, une par écran, UX propre) :
   - Q1: "Pense à un moment récent où tu t'es senti vraiment vivant. Que faisais-tu ?"
   - Q2: "Qu'est-ce qui te met en colère quand tu le vois dans le monde ?"
   - Q3: "Dans quoi les gens viennent-ils te demander de l'aide ?"
   - Q4: "Quel trait de caractère tu sais que tu devrais changer, mais que tu repousses ?"
   - Q5: "Face à l'inconnu, ta première réaction : fuir, réfléchir, ou foncer ?"
   - Q6: "Imagine-toi dans 5 ans, ta meilleure version. Décris cette scène."
3. Les réponses sont stockées (CoachMessage avec zone taggée)
4. Le LLM génère un **profil initial** (CoachProfile) + identifie les **zones floues**
5. Le coach propose de commencer l'approfondissement ou de revenir plus tard

### 2. Session de coaching (approfondissement)
1. L'utilisateur clique "Commencer une session" → CoachSession créée (status: active)
2. **Avant chaque message du coach**, le backend :
   - Charge le CoachProfile complet
   - Charge les N derniers messages de la session en cours
   - Charge les unclearZones
   - Envoie tout en contexte au LLM
3. Le LLM :
   - Reformule, questionne, approfondit les zones floues
   - Note chaque réponse utilisateur (insightScore 0-10)
   - Met à jour le profil si une nouvelle insight émerge
4. L'utilisateur peut **quitter à tout moment** → session passe en "paused"
5. Au retour → le coach résume où on en était et reprend

### 3. Scoring Sagesse
- Chaque réponse utilisateur est évaluée par le LLM (insightScore 0-10)
- **Sagesse gagnée** = Σ(insightScores) de la session
- Formule de conversion : `wisdomPoints = floor(totalInsightScore / 5)`
- La stat `wisdom` du User.Stats est mise à jour en temps réel
- Bonus si une zone passe de "floue" à "claire" (+10 wisdom)

---

## System Prompt du Coach (pour le LLM)

```
Tu es le Coach MyQuest, un expert en développement personnel basé sur :
- Maps of Meaning (Jordan Peterson) — chaos/ordre, archétype du héros
- Self-Authoring (Peterson) — écriture réflexive passé/présent/futur
- Atomic Habits (James Clear) — transformation par les habitudes
- Logothérapie (Viktor Frankl) — sens et responsabilité
- Psychologie jungienne — ombre, individuation, archétypes

## Ton rôle
Tu guides l'utilisateur dans une introspection structurée. Tu ne donnes PAS de réponses — tu poses des questions qui font réfléchir.

## Ce que tu sais de l'utilisateur
{coach_profile}

## Zones floues à explorer
{unclear_zones}

## Historique de la session
{session_messages}

## Règles
1. TOUJOURS relire le profil avant de répondre
2. Cibler les zones floues en priorité — pose des questions qui les clarifient
3. Une question à la fois, jamais de liste
4. Reformuler ce que l'utilisateur dit avant de creuser ("Tu dis X... qu'est-ce que ça signifie pour toi ?")
5. Valider l'émotion avant de challenger
6. Jamais de jugement
7. Utiliser le prénom de l'utilisateur
8. À chaque réponse, évaluer silencieusement :
   - insightScore (0-10) : profondeur de la réponse
   - zone : quelle zone du profil est concernée
   - profileUpdate : faut-il mettre à jour le profil ?
9. Si l'utilisateur veut arrêter, résumer la session et encourager

## Format de réponse (JSON)
{
  "reply": "Ton message texte au format naturel",
  "insightScore": 7,
  "zone": "values",
  "profileUpdate": null | { "field": "values", "value": {...} },
  "unclearZoneUpdate": null | { "zone": "shadows", "clarity": 0.7 }
}
```

---

## API Endpoints

### POST /coach/onboarding
Body: `{ answers: [{question: string, answer: string, zone: string}] }`
→ Stocke les réponses, génère le profil initial via LLM, retourne le profil + zones floues

### POST /coach/session/start
→ Crée une nouvelle session (ou reprend la dernière session paused)
→ Retourne: sessionId, résumé du profil, premier message du coach

### POST /coach/session/:id/message
Body: `{ message: string }`
→ Envoie au LLM avec contexte complet, retourne la réponse + met à jour profil/wisdom

### POST /coach/session/:id/end
→ Termine la session, calcule wisdom total gagné, met à jour stats

### GET /coach/profile
→ Retourne le profil complet + zones floues + wisdom progression

---

## Frontend

### Écrans
1. **CoachOnboardingScreen** — 6 questions, une par écran, input texte libre, bouton suivant
2. **CoachChatScreen** — Chat classique avec le coach, bouton "Terminer la session" en haut
3. **CoachProfileScreen** — Visualisation du profil (radar chart des zones claires/floues, portrait)

### UX
- Bouton "Commencer une session" visible sur le Dashboard
- Indicateur de sagesse visible (barre de progression ou chiffre)
- Notification quand le coach a identifié une nouvelle zone à explorer
- Animation quand wisdom augmente

---

## LLM Choice
- **Anthropic Claude 3.5 Sonnet** (bon rapport qualité/prix/vitesse pour du coaching)
- Clé API à configurer en env var `ANTHROPIC_API_KEY`
- Fallback: réponses rule-based si pas de clé (mode dégradé)
