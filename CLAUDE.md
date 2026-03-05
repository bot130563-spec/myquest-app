# CLAUDE.md — MyQuest App

## Projet
**MyQuest** est une application de coaching de vie gamifiée, inspirée de Duolingo et MyFitnessPal.

## Stack technique
- **Frontend:** React Native + Expo SDK 54, TypeScript, React Navigation
- **Backend:** Node.js + Express + TypeScript, Prisma ORM, PostgreSQL
- **Base de données:** PostgreSQL sur Render Frankfurt
- **Déploiement:** Render.com (backend), Expo Go / Web (frontend)
- **Repo:** github.com/bot130563-spec/myquest-app

## URLs importantes
- Backend prod : https://myquest-api.onrender.com
- DB : postgresql://myquest_user:52aEXqCGzOFntnwVwPLMylCpgXabDMtX@dpg-d65psbi48b3s73aprrb0-a.frankfurt-postgres.render.com/myquest_vurb

## Structure du projet
```
myquest-app/
├── backend/
│   ├── src/
│   │   ├── routes/        # Express routes (auth, quest, habit, journal, dashboard, achievements, coach, leaderboard)
│   │   ├── middleware/    # Auth middleware
│   │   └── index.ts      # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
└── frontend/
    ├── src/
    │   ├── screens/      # All app screens
    │   ├── navigation/   # React Navigation setup
    │   └── api/          # API module (uses axios)
    └── App.tsx
```

## Features existantes
- ✅ Auth (register/login JWT)
- ✅ Quests (objectifs long terme)
- ✅ Habits (habitudes quotidiennes)
- ✅ Journal (entrées journalières)
- ✅ Dashboard (vue d'ensemble)
- ✅ Achievements (badges + XP)
- ✅ AI Coach V2 (onboarding, sessions, projets)

## Features en cours (ne pas refaire)
- ✅ Streak System (POST /complete + GET /streak + 🔥 UI)
- ✅ Weekly Summary (GET /dashboard/weekly-summary)
- ✅ Daily Progress bar (GET /dashboard/daily-progress)
- ✅ Reminder time sur Habits (PATCH /habits/:id/reminder)
- ✅ Leaderboard (GET /leaderboard + LeaderboardScreen)
- ✅ Tests Jest backend (26 tests, 4 fichiers)

## Conventions de code
- TypeScript strict
- Prisma pour TOUTES les requêtes DB (jamais de SQL raw sauf si migration)
- Routes Express dans `backend/src/routes/` — un fichier par domaine
- Frontend : composants fonctionnels React, hooks, pas de classes
- API calls via `src/api/` module (jamais de fetch direct dans les screens)
- Gestion d'erreurs : try/catch + responses JSON `{ error: string }`

## Authentification
- JWT dans header `Authorization: Bearer <token>`
- Middleware `authMiddleware` dans toutes les routes protégées
- User ID disponible via `req.userId` après auth

## Modèle de données (Prisma)
- User: id, email, password, name, createdAt, updatedAt
- Avatar: id, userId, name, level, experience, avatarType, appearance
- Stats: id, userId, body, mind, wisdom, social, love, career, finance, currentStreak, longestStreak
- Quest: id, userId, title, description, category, difficulty, status, dueDate
- Habit: id, userId, title, frequency, currentStreak, longestStreak, totalCompletions, reminderTime
- HabitLog: id, habitId, completedDate
- JournalEntry: id, userId, entryDate, mood, content, gratitudes
- UserAchievement: id, userId, achievementId, unlockedAt
- CoachProfile: id, userId, values, strengths, shadows, chaosOrder, vision, summary
- CoachSession: id, userId, status, phase, topic, messages[]
- CoachMessage: id, sessionId, role, content, insightScore
- CoachProjectProposal: id, userId, title, description, type, status

## Règles importantes
- Ne jamais commit de secrets/clés API en dur
- Toujours créer les migrations Prisma (`npx prisma migrate dev --name <desc>`)
- Tests : Jest pour le backend, tester les endpoints critiques
- Après chaque feature : commit avec message conventionnel (`feat:`, `fix:`, `test:`)
- Push sur `origin main` après chaque feature

## Workflow de développement
1. Lire les fichiers existants avant de modifier
2. Modifier schema.prisma si nécessaire → migrate
3. Implémenter la route backend
4. Enregistrer la route dans index.ts
5. Implémenter le screen/composant frontend
6. Tester (curl ou Jest)
7. Commit + push

## Ne pas faire
- Ne pas utiliser `any` en TypeScript sans raison
- Ne pas modifier le schema sans migration
- Ne pas dupliquer la logique auth (utiliser le middleware)
- Ne pas toucher aux features déjà déployées sans test
