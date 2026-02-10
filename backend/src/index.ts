/**
 * ==========================================
 * 🎮 MYQUEST API - POINT D'ENTRÉE PRINCIPAL
 * ==========================================
 * 
 * Ce fichier est le cœur du serveur backend.
 * Il configure Express et démarre l'API.
 * 
 * STRUCTURE:
 * 1. Imports des dépendances
 * 2. Configuration de l'app Express
 * 3. Middlewares (sécurité, parsing JSON)
 * 4. Routes (health check, API)
 * 5. Gestion des erreurs
 * 6. Démarrage du serveur
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';       // Permet les requêtes cross-origin (frontend → backend)
import helmet from 'helmet';   // Sécurise les headers HTTP
import dotenv from 'dotenv';   // Charge les variables d'environnement depuis .env
import routes from './routes'; // Nos routes API

// ============================================
// 📦 CHARGEMENT DES VARIABLES D'ENVIRONNEMENT
// ============================================
// dotenv lit le fichier .env et met les valeurs dans process.env
// Ex: DATABASE_URL, JWT_SECRET, PORT, NODE_ENV
dotenv.config();

// ============================================
// 🏗️ CRÉATION DE L'APPLICATION EXPRESS
// ============================================
const app = express();

// PORT: utilise la variable d'env (Render la définit automatiquement) ou 3000 par défaut
const PORT = process.env.PORT || 3000;

// ============================================
// 🛡️ MIDDLEWARES - S'exécutent sur CHAQUE requête
// ============================================

// helmet() → Ajoute des headers de sécurité (protection XSS, clickjacking, etc.)
app.use(helmet());

// cors() → Autorise les requêtes depuis d'autres domaines (ton app React Native)
// Sans ça, le navigateur bloquerait les appels API
app.use(cors());

// express.json() → Parse le body des requêtes en JSON
// Permet d'accéder à req.body quand le client envoie du JSON
app.use(express.json());

// express.urlencoded() → Parse les données de formulaire (x-www-form-urlencoded)
// extended: true permet les objets imbriqués
app.use(express.urlencoded({ extended: true }));

// ============================================
// 💓 HEALTH CHECK - Vérifie que le serveur tourne
// ============================================
// Render et autres services utilisent cette route pour vérifier
// que l'app est "healthy" (vivante et fonctionnelle)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',                          // Le serveur répond
    timestamp: new Date().toISOString(),   // Quand
    service: 'myquest-api',                // Quel service
    version: '1.0.0'                       // Version actuelle
  });
});

// ============================================
// 🛤️ ROUTES API - Toutes préfixées par /api
// ============================================
// Exemple: POST /api/auth/login, GET /api/user/profile
// Les routes sont définies dans ./routes/index.ts
app.use('/api', routes);

// ============================================
// ❌ GESTION 404 - Route non trouvée
// ============================================
// Ce middleware s'exécute si aucune route précédente n'a match
// C'est le "catch-all" pour les URLs inexistantes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// ============================================
// 🚨 GESTION DES ERREURS GLOBALE
// ============================================
// Middleware spécial à 4 paramètres (err en premier)
// Capture toutes les erreurs throw dans l'app
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Log l'erreur côté serveur (visible dans les logs Render)
  console.error('Error:', err.message);
  
  res.status(500).json({
    error: 'Internal Server Error',
    // En dev: montre le message d'erreur (utile pour débugger)
    // En prod: message générique (sécurité - cache les détails)
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// 🚀 DÉMARRAGE DU SERVEUR
// ============================================
// app.listen() ouvre le port et attend les connexions
app.listen(PORT, () => {
  console.log(`
  🎮 MyQuest API Server
  =====================
  Status: Running
  Port: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Health: http://localhost:${PORT}/health
  API: http://localhost:${PORT}/api
  `);
});

// Export pour les tests
export default app;
