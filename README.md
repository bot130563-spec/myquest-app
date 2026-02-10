# 🎮 MyQuest - Coach de Vie Gamifié

> Transforme ta vie en aventure épique! MyQuest est une application de coaching personnel qui gamifie ton développement avec un système de quêtes, stats et avatar évolutif.

## 📁 Structure du Projet

```
myquest-app/
├── backend/                 # API Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma    # Schéma de base de données
│   ├── src/
│   │   ├── index.ts         # Point d'entrée serveur
│   │   └── routes/          # Définition des routes API
│   ├── package.json
│   └── .env.example         # Template des variables d'env
│
├── frontend/                # App React Native + Expo
│   ├── src/
│   │   ├── screens/         # Écrans de l'app
│   │   └── theme/           # Styles et couleurs
│   ├── App.tsx              # Point d'entrée app
│   └── package.json
│
├── render.yaml              # Config déploiement Render
├── RENDER-SETUP.md          # Guide de déploiement
└── README.md                # Ce fichier
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- PostgreSQL (local) OU compte Render (cloud)
- Expo Go sur ton téléphone (pour tester)

### 1. Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer la DATABASE_URL dans .env
# Pour local: postgresql://postgres:postgres@localhost:5432/myquest

# Générer le client Prisma
npx prisma generate

# Créer les tables (première fois)
npx prisma migrate dev --name init

# Lancer le serveur de développement
npm run dev
```

Le serveur tourne sur http://localhost:3000

### 2. Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer Expo
npm start
```

Scanne le QR code avec Expo Go sur ton téléphone.

## 🗄️ Base de Données

### Schéma

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs (email, password, nom) |
| `avatars` | Personnage du joueur (niveau, XP, apparence) |
| `stats` | Stats de vie (santé, énergie, sagesse, social, wealth) |

### Commandes Prisma

```bash
# Voir les données (interface web)
npx prisma studio

# Créer une migration après modif du schéma
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Régénérer le client après modif
npx prisma generate
```

## 🌐 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | Liste des endpoints |
| POST | `/api/auth/register` | Inscription (à implémenter) |
| POST | `/api/auth/login` | Connexion (à implémenter) |
| GET | `/api/user/profile` | Profil utilisateur |
| GET | `/api/user/avatar` | Avatar et niveau |
| GET | `/api/user/stats` | Statistiques de vie |

## 🚀 Déploiement sur Render

Voir le guide complet: [RENDER-SETUP.md](./RENDER-SETUP.md)

**Version courte:**
1. Push sur GitHub
2. Render > New > Blueprint
3. Connecte le repo
4. Render crée tout automatiquement via `render.yaml`

## 🎨 Thème & Couleurs

Palette sombre gamifiée définie dans `frontend/src/theme/colors.ts`:

- **Primary:** `#1a1a2e` (fond sombre)
- **Accent:** `#e94560` (actions, boutons)
- **Gold:** `#ffc947` (XP, achievements)
- **Success:** `#00d9a6` (validations)

## 📝 Prochaines Étapes

- [ ] Implémenter l'authentification (register/login)
- [ ] Créer le système de quêtes
- [ ] Ajouter les habitudes récurrentes
- [ ] Système de notifications push
- [ ] Coach IA pour conseils personnalisés
- [ ] Achievements et récompenses
- [ ] Personnalisation de l'avatar

## 🛠️ Stack Technique

**Backend:**
- Node.js + Express
- TypeScript
- Prisma (ORM)
- PostgreSQL
- JWT (auth)
- Zod (validation)

**Frontend:**
- React Native
- Expo
- TypeScript
- React Navigation

**Déploiement:**
- Render (backend + DB)
- Expo EAS (app mobile)

---

Fait avec 💜 pour devenir la meilleure version de toi-même.
