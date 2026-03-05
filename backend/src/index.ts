/**
 * ==========================================
 * 🎮 MYQUEST API - POINT D'ENTRÉE PRINCIPAL
 * ==========================================
 *
 * Démarre le serveur HTTP et connecte la base de données.
 * L'app Express est configurée dans app.ts.
 */

import { validateEnv } from './config/env';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import app from './app';

// Validation de l'environnement
validateEnv();

// Démarrage du serveur
async function startServer(): Promise<void> {
  try {
    await connectDatabase();

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

    const shutdown = async (signal: string) => {
      console.log(`\n📴 ${signal} reçu. Arrêt en cours...`);

      server.close(async () => {
        console.log('🔌 Serveur HTTP fermé');
        await disconnectDatabase();
        console.log('👋 Au revoir!');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('⚠️ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
}

// Lance le serveur (sauf en mode test - supertest gère le port)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export pour backward compatibility
export default app;
