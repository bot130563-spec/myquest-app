/**
 * ==========================================
 * 🏗️ APPLICATION EXPRESS - Configuration
 * ==========================================
 *
 * Ce fichier crée et configure l'app Express
 * sans démarrer le serveur HTTP.
 * Utilisé par index.ts (production) et les tests.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import routes from './routes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'myquest-api',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// Routes API
app.use('/api', routes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'La ressource demandée n\'existe pas',
    hint: 'Consultez GET /api pour la liste des endpoints disponibles',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', err.message);
  if (config.isDevelopment) {
    console.error(err.stack);
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: config.isDevelopment ? err.message : 'Une erreur est survenue',
  });
});

export default app;
