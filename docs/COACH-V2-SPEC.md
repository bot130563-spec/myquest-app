# Coach V2 — Spécification Technique

## Vision
Un coach structuré hybride : questionnaire rapide d'onboarding (6 questions) + approfondissement conversationnel via LLM. Le coach détecte les zones floues du profil et guide l'utilisateur vers plus de clarté. L'introspection débouche sur des **projets concrets** proposés par l'IA en collaboration avec l'utilisateur. Chaque session d'introspection fait monter la stat **Sagesse**.

## Cadre Théorique
- **Maps of Meaning** (Jordan Peterson) — chaos/ordre, archétype du héros, construction du sens
- **Self-Authoring** (Peterson) — écriture réflexive passé/présent/futur
- **Atomic Habits** (James Clear) — transformation par les habitudes
- **Logothérapie** (Viktor Frankl) — sens et responsabilité
- **Psychologie jungienne** — ombre, individuation, archétypes
- **Monomythe** (Joseph Campbell) — voyage du héros

## Les 7 Dimensions de Vie

| Stat | Emoji | Couvre |
|------|-------|--------|
| **Corps** | 💪 | Santé physique, sport, sommeil, alimentation |
| **Esprit** | 🧠 | Santé mentale, émotions, stress, paix intérieure |
| **Sagesse** | 📚 | Apprentissage, connaissance de soi, introspection |
| **Social** | 👥 | Amis, famille, réseau, vie sociale |
| **Amour** | ❤️ | Couple, intimité, connexion profonde (optionnel — l'utilisateur choisit d'en parler ou non) |
| **Carrière** | 🎯 | Travail, projets, ambition, compétences, purpose |
| **Finances** | 💰 | Argent, patrimoine, sécurité financière |

### Sagesse = méta-stat
L'introspection fait monter **Wisdom** directement. Mais la Sagesse a un effet de **répercussion sur tous les domaines** :
- Plus le profil est clair (wisdom haute) → plus le coach a une vision globale de l'utilisateur
- Plus la vision est globale → plus les projets proposés sont **pertinents, réalistes, adaptés et évolutifs**
- Les projets impactent ensuite Corps, Esprit, Social, Amour, Carrière, Finances selon leur nature

**Flywheel : plus tu te connais → meilleurs sont tes projets → plus tu progresses partout.**

### Limites du Coach (santé mentale)
Le coach est un outil de **développement personnel**, PAS un thérapeute :
- Il peut explorer les émotions et patterns dans le cadre de l'introspection
- Il NE pose PAS de diagnostic (dépression, anxiété, trauma, etc.)
- Si l'utilisateur exprime une détresse importante, le coach :
  1. Valide l'émotion avec empathie
  2. Rappelle qu'il n'est pas un professionnel de santé mentale
  3. Suggère de consulter un psychologue ou thérapeute
  4. Propose de continuer sur un sujet où il peut aider
- Il ne prescrit jamais de médicaments, régimes, ou traitements
- Il ne pousse jamais l'utilisateur au-delà de ce qu'il est prêt à explorer

## Principes
1. **Mémoire persistante** — Les réponses sont stockées en DB. Le LLM charge le profil complet au début de chaque session.
2. **Détection des zones d'ombre** — Le modèle analyse le profil et identifie ce qui est vague, contradictoire ou inexploré.
3. **Sessions transparentes** — Auto-save à chaque message. Quitter l'onglet = pause automatique. Reprendre = dashboard d'avancement + résultats clés.
4. **Sagesse = méta-stat** — L'introspection fait monter `wisdom` et se répercute sur tous les domaines via la pertinence des projets proposés.
5. **Introspection → Projets** — Le coach transforme la connaissance de soi en projets concrets via un dialogue collaboratif.
6. **Vision globale** — Le coach doit avoir une compréhension complète de l'utilisateur (7 dimensions) pour proposer des projets adaptés à sa situation réelle.

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
  // [{zone: "values", clarity: 0.3, reason: "réponses vagues sur ce qui le motive"}]
  unclearZones Json?
  
  // Phase actuelle du coaching
  currentPhase   Int     @default(1) // 1=connaissance, 2=vision, 3=habitudes, 4=action
  onboardingDone Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### CoachSession
Représente une session de coaching (auto-saved, pause/resume transparente).

```prisma
model CoachSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  status      String   @default("active") // active, paused, completed
  phase       Int      @default(1)
  topic       String?  // Sujet principal de la session (identifié par le LLM)
  
  // Sagesse gagnée dans cette session
  wisdomGained Int     @default(0)
  
  // Snapshot du profil au début de session (évite de recharger à chaque message)
  profileSnapshot Json?
  
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
  
  // Metadata pour le scoring (rempli par le LLM pour les messages "user")
  insightScore Int?    // 0-10, profondeur de la réponse
  zone        String?  // Quelle zone du profil cette réponse concerne
  
  createdAt   DateTime @default(now())
}
```

### CoachProjectProposal
Proposition de projet générée par le coach, en attente de validation utilisateur.

```prisma
model CoachProjectProposal {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionId   String?
  
  title       String
  description String
  why         String   // Lien avec le profil ("Issu de ton introspection sur...")
  type        String   // remediation | amplification | alignment | confrontation | vision
  
  // Stats impactées
  statsImpact Json?    // {wisdom: 2, social: 3, ...}
  
  // Status du flow
  status      String   @default("proposed") // proposed | discussing | validated | rejected
  
  // Si validé, référence vers le Quest créé
  questId     String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Flow Utilisateur

### 1. Premier lancement (Onboarding)

1. L'utilisateur ouvre le Coach → écran d'intro court expliquant le concept
2. **Questionnaire rapide** (6 questions, une par écran, UX propre) :
   - Q1 [values]: "Pense à un moment récent où tu t'es senti vraiment vivant. Que faisais-tu ?"
   - Q2 [values]: "Qu'est-ce qui te met en colère quand tu le vois dans le monde ?"
   - Q3 [strengths]: "Dans quoi les gens viennent-ils te demander de l'aide ?"
   - Q4 [shadows]: "Quel trait de caractère tu sais que tu devrais changer, mais que tu repousses ?"
   - Q5 [chaosOrder]: "Face à l'inconnu, ta première réaction : fuir, réfléchir, ou foncer ?"
   - Q6 [vision]: "Imagine-toi dans 5 ans, ta meilleure version. Décris cette scène."
3. Les réponses sont stockées (CoachMessage avec zone taggée)
4. Le LLM génère un **profil initial** (CoachProfile) + identifie les **zones floues**
5. **Transition transparente** vers le chat — le coach enchaîne naturellement avec une première question d'approfondissement basée sur la zone la plus floue

### 2. Dashboard Coach (à l'ouverture de l'onglet)

Quand l'utilisateur revient sur l'onglet Coach, il voit :
- **Résumé du profil** — portrait synthétique en quelques lignes
- **Avancement** — barre de progression par zone (values, strengths, shadows, chaosOrder, vision) avec indicateur de clarté (0-100%)
- **Résultats clés** — les insights principales identifiées jusqu'ici
- **Projets proposés** — projets en attente de validation
- **Bouton "Continuer"** → reprend la session là où elle était

### 3. Session de coaching (approfondissement)

1. L'utilisateur clique "Continuer" → CoachSession créée ou reprise
2. **Au début de la session**, le backend :
   - Charge le CoachProfile complet
   - Charge les unclearZones
   - Stocke un snapshot dans la session (profileSnapshot)
   - Envoie au LLM pour générer le premier message de reprise
3. **Pendant la session**, le LLM utilise :
   - Le profileSnapshot (chargé une fois)
   - Les messages de la session en cours (s'accumulent)
   - Les unclearZones
   - → Discussion fluide et humaine, pas de rechargement à chaque message
4. **Auto-save** : chaque message est persisté immédiatement
5. **Quitter l'onglet** = session passe en "paused" automatiquement (pas de bouton "terminer")
6. Le profil est mis à jour en fin de session (ou quand le LLM signale un profileUpdate important)

### 4. Scoring Sagesse

- Chaque réponse utilisateur est évaluée par le LLM (insightScore 0-10)
- **Sagesse gagnée** = Σ(insightScores) de la session
- Formule de conversion : `wisdomPoints = floor(totalInsightScore / 5)`
- La stat `wisdom` du User.Stats est mise à jour à chaque message
- **Bonus** : quand une zone passe de "floue" (< 0.5) à "claire" (> 0.7) → +10 wisdom
- L'utilisateur voit la progression en temps réel (animation subtile)

---

## Pipeline Introspection → Projets

### Les 5 types de projets

| Type | Source dans le profil | Logique | Exemple |
|------|----------------------|---------|---------|
| **🩹 Remédiation** | Shadows (faiblesses) | Attaquer la cause racine, pas le symptôme | "Timide" → root cause "ne sait pas structurer sa pensée" → Projet "Développer son éloquence" |
| **🚀 Amplification** | Strengths (forces) | Pousser un talent au niveau supérieur | Fort en technique → Projet "Développer l'app de tes rêves" |
| **🧭 Alignement** | Values vs réalité | Combler le gap entre valeurs et quotidien | Valeur "impact environnemental" + job non lié → Projet "Side-project énergie verte" |
| **🐉 Confrontation** | ChaosOrder (dragons évités) | Le dragon cache le trésor (Maps of Meaning) | Évite les conflits → Projet "Apprendre à poser des limites" |
| **🌉 Vision** | Vision (futur idéal) | Pont entre le moi actuel et le moi dans 5 ans | Vision "consultant reconnu" + réalité "salarié sans réseau" → Projet "Construire son réseau pro" |

### Flow de génération (dialogue collaboratif en 6 étapes)

Le coach ne propose JAMAIS un projet froid. C'est toujours un dialogue :

```
1. OBSERVATION — Le coach repère un pattern dans le profil
   Coach: "J'ai remarqué que tu mentionnes souvent le besoin d'être 
   écouté, mais tu dis aussi que tu as du mal à t'exprimer..."

2. EXPLORATION — Il creuse avec l'utilisateur  
   Coach: "Qu'est-ce qui se passe concrètement quand tu essaies 
   de t'exprimer ? C'est dans quel contexte ?"

3. DIAGNOSTIC — Il nomme la racine
   Coach: "On dirait que le vrai sujet c'est pas la timidité — c'est 
   que tu ne te fais pas confiance sur ta capacité à construire un 
   argument. Ça te parle ?"

4. PROPOSITION — Il suggère une direction (pas un projet figé)
   Coach: "Et si on travaillait là-dessus ? Pas devenir un orateur 
   du jour au lendemain, mais progressivement apprendre à structurer 
   ta pensée et la porter. Qu'est-ce que tu en penses ?"

5. CO-CONSTRUCTION — Ensemble ils précisent
   Coach: "Comment tu verrais ça concrètement ? Ça pourrait être 
   de la lecture, de la pratique, des challenges..."

6. VALIDATION — L'utilisateur confirme → le projet est créé
   Coach: "OK, je te crée le projet 'Développer mon éloquence'. 
   On pourra le décomposer en étapes ensemble."
   → CoachProjectProposal créé (status: "validated")
   → Quest créé dans l'onglet Projets
```

### Structure d'un projet transmis à l'onglet Projets

Quand l'utilisateur valide, un Quest est créé avec :
- **Titre** — nom du projet
- **Description** — description + contexte
- **Pourquoi (why)** — lien avec le profil ("Issu de ton introspection : tu as identifié que...")
- **Type** — remédiation / amplification / alignement / confrontation / vision
- **Stats impactées** — quelles stats montent en progressant (wisdom, social, etc.)
- **Catégorie** — mappée automatiquement (HEALTH, CAREER, SOCIAL, MIND, FINANCE)
- **Status** — ACTIVE
- **Sous-objectifs** — le coach peut ensuite aider à décomposer en étapes + habitudes liées

---

## System Prompt du Coach (pour le LLM)

```
Tu es le Coach MyQuest, un expert en développement personnel.

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
{coach_profile_snapshot}

## Zones floues à explorer (priorité)
{unclear_zones}

## Historique de la session en cours
{session_messages}

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
{
  "reply": "Ton message au format naturel conversationnel",
  "insightScore": 0-10,        // profondeur de la dernière réponse user (0 si premier message)
  "zone": "values|strengths|shadows|chaosOrder|vision|null",
  "profileUpdate": null | {
    "field": "values|strengths|shadows|chaosOrder|vision|summary",
    "value": { ... }
  },
  "unclearZoneUpdate": null | {
    "zone": "string",
    "clarity": 0.0-1.0
  },
  "projectProposal": null | {
    "step": "observation|exploration|diagnostic|proposition|co-construction|validation",
    "title": "string (si step >= proposition)",
    "description": "string (si step >= proposition)",
    "why": "string (si step >= proposition)",
    "type": "remediation|amplification|alignment|confrontation|vision",
    "statsImpact": {"wisdom": 0, "health": 0, "energy": 0, "social": 0, "wealth": 0}
  }
}
```

---

## API Endpoints

### POST /coach/onboarding
Body: `{ answers: [{question: string, answer: string, zone: string}] }`
→ Stocke les réponses, génère le profil initial via LLM
→ Retourne: profil + zones floues + premier message du coach

### GET /coach/dashboard
→ Retourne: résumé du profil, avancement par zone (clarity %), insights clés, projets proposés, dernière session

### POST /coach/session/start
→ Crée une nouvelle session ou reprend la dernière paused
→ Charge le profil, crée le snapshot, génère le message de reprise
→ Retourne: sessionId, message du coach

### POST /coach/session/:id/message
Body: `{ message: string }`
→ Envoie au LLM avec : profileSnapshot + messages session + unclearZones
→ Stocke la réponse, met à jour wisdom, applique profileUpdate si présent
→ Retourne: réponse du coach + wisdom gagné + éventuelle proposition de projet

### POST /coach/session/:id/pause
→ Passe la session en paused (appelé automatiquement quand l'utilisateur quitte l'onglet)
→ Met à jour le profil avec les insights de la session

### GET /coach/profile
→ Retourne le profil complet + zones floues + historique wisdom

### POST /coach/project/:id/validate
→ Valide une proposition de projet → crée un Quest dans l'onglet Projets
→ Retourne: le Quest créé

### POST /coach/project/:id/reject
→ Rejette une proposition (le coach en tiendra compte)

---

## Frontend

### Écrans

1. **CoachOnboardingScreen** — 6 questions, une par écran, input texte libre, progress bar, transition fluide vers le chat
2. **CoachDashboardScreen** — Vue d'ensemble :
   - Portrait synthétique (résumé texte)
   - Radar chart ou barres de clarté par zone (values, strengths, shadows, chaosOrder, vision)
   - Insights clés (bullet points)
   - Projets proposés (cards avec bouton valider/rejeter)
   - Bouton "Continuer la session"
   - Stat wisdom avec progression
3. **CoachChatScreen** — Chat fluide avec le coach
   - Messages user/coach
   - Indicateur wisdom en temps réel (petite animation quand ça monte)
   - Auto-save (pas de bouton sauvegarder)
   - Quitter = pause automatique
   - Card spéciale quand le coach propose un projet (bouton valider/rejeter inline)

### UX Flow
```
[Onglet Coach]
    ├── Premier lancement → OnboardingScreen → ChatScreen (transition fluide)
    └── Retours suivants → DashboardScreen
                              ├── "Continuer" → ChatScreen
                              └── Consulter profil / projets
```

### Comportements
- **Quitter l'onglet** (navigation, fermeture) → `POST /coach/session/:id/pause` automatique
- **Revenir** → DashboardScreen avec avancement à jour
- **Proposition de projet** → card spéciale dans le chat avec boutons Valider / Pas maintenant
- **Projet validé** → toast "Projet créé ! Retrouve-le dans l'onglet Projets" + animation

---

## LLM Configuration

- **Provider** : Anthropic (Claude 3.5 Sonnet — bon ratio qualité/prix/vitesse)
- **Env var** : `ANTHROPIC_API_KEY`
- **Max tokens par réponse** : 500
- **Température** : 0.7 (créatif mais cohérent)
- **Fallback** : Si pas de clé API → mode rule-based dégradé (le système actuel amélioré)

---

## Mapping Stats (7 dimensions)

### DB Schema — Stats (mise à jour)
```prisma
model Stats {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  // Les 7 dimensions (0-100)
  body          Int      @default(50)  // 💪 Corps
  mind          Int      @default(50)  // 🧠 Esprit
  wisdom        Int      @default(50)  // 📚 Sagesse
  social        Int      @default(50)  // 👥 Social
  love          Int      @default(50)  // ❤️ Amour
  career        Int      @default(50)  // 🎯 Carrière
  finance       Int      @default(50)  // 💰 Finances
  
  currentStreak  Int     @default(0)
  longestStreak  Int     @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Introspection → Wisdom (direct)
| Zone du profil | Wisdom gain |
|---------------|-------------|
| values | +wisdom (comprendre ses valeurs) |
| strengths | +wisdom (connaître ses forces) |
| shadows | +wisdom (confronter son ombre) |
| chaosOrder | +wisdom (comprendre son rapport au changement) |
| vision | +wisdom (clarifier sa direction) |
| Zone floue → claire | +10 wisdom bonus |

### Projets → Toutes dimensions (indirect via wisdom)
Le coach utilise le profil complet (nourri par wisdom) pour proposer des projets qui impactent la bonne dimension :

| Type de projet | Stats impactées (exemples) |
|---------------|---------------------------|
| Remédiation "Vaincre sa timidité" | social +, mind + |
| Amplification "Développer l'app de ses rêves" | career +, wisdom + |
| Alignement "Side-project énergie verte" | career +, mind + |
| Confrontation "Poser des limites" | social +, mind + |
| Vision "Construire son réseau pro" | career +, social + |
| Remédiation "Routine sport" | body +, mind + |
| Vision "Lancer son business" | career +, finance + |

Le LLM détermine les statsImpact au moment de la proposition, basé sur la nature du projet et le profil de l'utilisateur.

---

## Résumé du Pipeline

```
ONBOARDING (6 questions)
    ↓
PROFIL INITIAL (généré par LLM)
    ↓
SESSIONS D'APPROFONDISSEMENT (chat LLM)
    ↓ détecte zones floues → creuse
    ↓ wisdom augmente
    ↓
PROFIL AFFINÉ (zones deviennent claires)
    ↓
PROPOSITIONS DE PROJETS (dialogue collaboratif)
    ↓ observation → exploration → diagnostic → proposition → co-construction → validation
    ↓
PROJETS VALIDÉS → ONGLET PROJETS (Quest)
    ↓
DÉCOMPOSITION EN HABITUDES (le coach aide ensuite)
```
