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
 * 2. Validation de l'environnement
 * 3. Configuration de l'app Express
 * 4. Middlewares (sécurité, parsing JSON)
 * 5. Routes (health check, API)
 * 6. Gestion des erreurs
 * 7. Connexion DB + démarrage du serveur
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';       // Permet les requêtes cross-origin (frontend → backend)
import helmet from 'helmet';   // Sécurise les headers HTTP
import { config, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import routes from './routes'; // Nos routes API

// ============================================
// ✅ VALIDATION DE L'ENVIRONNEMENT
// ============================================
// Vérifie que les variables critiques sont définies
// Crash au démarrage si quelque chose manque (mieux que plus tard)
validateEnv();

// ============================================
// 🏗️ CRÉATION DE L'APPLICATION EXPRESS
// ============================================
const app = express();

// ============================================
// 🛡️ MIDDLEWARES - S'exécutent sur CHAQUE requête
// ============================================

// helmet() → Ajoute des headers de sécurité (protection XSS, clickjacking, etc.)
app.use(helmet());

// cors() → Autorise les requêtes depuis d'autres domaines (ton app React Native)
// En production, tu peux restreindre les origines autorisées
app.use(cors({
  origin: config.isDevelopment 
    ? '*'  // Dev: accepte tout
    : process.env.FRONTEND_URL,  // Prod: seulement le frontend
  credentials: true,  // Permet l'envoi de cookies/headers auth
}));

// express.json() → Parse le body des requêtes en JSON
// Limite à 10kb pour éviter les attaques par payload énorme
app.use(express.json({ limit: '10kb' }));

// express.urlencoded() → Parse les données de formulaire (x-www-form-urlencoded)
// extended: true permet les objets imbriqués
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
    version: '1.0.0',                      // Version actuelle
    environment: config.nodeEnv,           // dev/production
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
    message: 'La ressource demandée n\'existe pas',
    hint: 'Consultez GET /api pour la liste des endpoints disponibles',
  });
});

// ============================================
// 🚨 GESTION DES ERREURS GLOBALE
// ============================================
// Middleware spécial à 4 paramètres (err en premier)
// Capture toutes les erreurs throw dans l'app
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Log l'erreur côté serveur (visible dans les logs Render)
  console.error('❌ Error:', err.message);
  if (config.isDevelopment) {
    console.error(err.stack);
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    // En dev: montre le message d'erreur (utile pour débugger)
    // En prod: message générique (sécurité - cache les détails)
    message: config.isDevelopment ? err.message : 'Une erreur est survenue',
  });
});

// ============================================
// 🚀 DÉMARRAGE DU SERVEUR
// ============================================
// Fonction async pour pouvoir attendre la connexion DB

async function startServer(): Promise<void> {
  try {
    // 1. Connecte à la base de données
    await connectDatabase();
    
    // 2. Démarre le serveur HTTP (0.0.0.0 = toutes les interfaces réseau)
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`
  🎮 MyQuest API Server
  =====================
  ✅ Status: Running
  🌐 Port: ${config.port}
  🔧 Environment: ${config.nodeEnv}
  💓 Health: http://localhost:${config.port}/health
  📚 API: http://localhost:${config.port}/api
  `);
    });
    
    // ============================================
    // 🛑 GRACEFUL SHUTDOWN - Arrêt propre
    // ============================================
    // Quand le processus reçoit un signal d'arrêt (SIGTERM, SIGINT),
    // on ferme proprement les connexions avant de quitter
    
    const shutdown = async (signal: string) => {
      console.log(`\n📴 ${signal} reçu. Arrêt en cours...`);
      
      // Arrête d'accepter de nouvelles connexions
      server.close(async () => {
        console.log('🔌 Serveur HTTP fermé');
        
        // Déconnecte la base de données
        await disconnectDatabase();
        
        console.log('👋 Au revoir!');
        process.exit(0);
      });
      
      // Si l'arrêt prend trop de temps, force la fermeture
      setTimeout(() => {
        console.error('⚠️ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);  // 10 secondes max
    };
    
    // Écoute les signaux d'arrêt
    process.on('SIGTERM', () => shutdown('SIGTERM'));  // Docker/Render
    process.on('SIGINT', () => shutdown('SIGINT'));    // Ctrl+C
    
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
}

// Lance le serveur!
startServer();

// Export pour les tests
export default app;
