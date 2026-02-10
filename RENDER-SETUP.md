# 🚀 Guide de Déploiement Render

Ce guide explique comment déployer MyQuest sur Render.com.

## Option 1: Blueprint Automatique (Recommandé)

Le fichier `render.yaml` à la racine configure tout automatiquement.

### Étapes:

1. **Push sur GitHub**
   ```bash
   cd myquest-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TON-USER/myquest-app.git
   git push -u origin main
   ```

2. **Connecter à Render**
   - Va sur [dashboard.render.com](https://dashboard.render.com)
   - Clique sur **New** > **Blueprint**
   - Connecte ton compte GitHub
   - Sélectionne le repo `myquest-app`
   - Render détecte `render.yaml` et propose de créer les services

3. **Confirmer**
   - Vérifie les services listés (myquest-api + myquest-db)
   - Clique sur **Apply**
   - Attends ~5 minutes que tout se déploie

4. **Lancer les migrations**
   - Dashboard > myquest-api > **Shell**
   - Exécute:
     ```bash
     npx prisma migrate deploy
     ```

5. **Récupérer l'URL**
   - Dashboard > myquest-api
   - Copie l'URL (ex: `https://myquest-api-xxxx.onrender.com`)

---

## Option 2: Création Manuelle

Si tu préfères créer les services un par un:

### A. Créer la Base de Données

1. Dashboard > **New** > **PostgreSQL**
2. Paramètres:
   - Name: `myquest-db`
   - Database: `myquest`
   - User: `myquest_user`
   - Region: `Frankfurt (EU Central)`
   - Plan: `Free`
3. Clique **Create Database**
4. Copie l'**Internal Database URL** (pour le backend)

### B. Créer le Service Web

1. Dashboard > **New** > **Web Service**
2. Connecte ton repo GitHub
3. Paramètres:
   - Name: `myquest-api`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Region: `Frankfurt` (même que DB)
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Plan: `Free`

4. **Variables d'environnement** (onglet Environment):
   ```
   NODE_ENV=production
   DATABASE_URL=<coller l'Internal Database URL>
   JWT_SECRET=<générer: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```

5. Clique **Create Web Service**

---

## 🔧 Commandes Utiles

### Accéder au Shell Render
Dashboard > myquest-api > Shell

### Voir les logs
Dashboard > myquest-api > Logs

### Redémarrer le service
Dashboard > myquest-api > Manual Deploy > Deploy latest commit

### Lancer une migration
```bash
# Dans le Shell Render
npx prisma migrate deploy
```

### Voir les données (Prisma Studio)
```bash
# En local seulement (pas sur Render)
npx prisma studio
```

---

## 💰 Plans et Tarifs

| Service | Free | Starter |
|---------|------|---------|
| **Web Service** | 750h/mois, sleep après 15min | $7/mois, toujours actif |
| **PostgreSQL** | 256 MB, expire 90j | $7/mois, 1 GB |

Pour commencer, le plan Free suffit. Passe à Starter quand tu as des utilisateurs réguliers.

---

## 🐛 Dépannage

### "Connection refused" à la DB
- Vérifie que DATABASE_URL utilise l'**Internal URL** (pas External)
- Les deux services doivent être dans la même région

### L'API est lente au premier appel
- Normal sur plan Free: le service "dort" après 15min d'inactivité
- Premier appel = réveil (~30 secondes)
- Solution: passer au plan Starter

### "Migration failed"
- Va dans Shell et lance manuellement:
  ```bash
  npx prisma migrate deploy
  ```

### Erreur "prisma not found"
- Le build doit inclure `npx prisma generate`
- Vérifie que `@prisma/client` est dans dependencies (pas devDependencies)

---

## 📱 Configurer le Frontend

Une fois l'API déployée, configure l'URL dans le frontend:

```typescript
// frontend/src/config/api.ts
export const API_URL = __DEV__ 
  ? 'http://localhost:3000'  // Dev local
  : 'https://myquest-api-xxxx.onrender.com';  // Production
```

Remplace `xxxx` par ton vrai sous-domaine Render.
