/**
 * ==========================================
 * 🗄️ CLIENT PRISMA - Connexion Base de Données
 * ==========================================
 * 
 * Configure et exporte le client Prisma.
 * Pattern singleton: une seule instance partagée.
 * 
 * USAGE:
 * import { prisma } from './config/database';
 * const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';
import { config } from './env';

// ============================================
// 🔧 OPTIONS DE LOGGING
// ============================================
// En dev: log les requêtes SQL (utile pour débugger)
// En prod: log seulement les erreurs

import { Prisma } from '@prisma/client';

const logLevel: Prisma.LogLevel[] = config.isDevelopment 
  ? ['query', 'error', 'warn']
  : ['error'];

const prismaOptions = {
  log: logLevel,
};

// ============================================
// 📦 SINGLETON PRISMA CLIENT
// ============================================
// On stocke l'instance dans globalThis pour éviter
// de créer plusieurs connexions en hot-reload (dev)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Réutilise l'instance existante ou en crée une nouvelle
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

// En dev, stocke l'instance pour le hot-reload
if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// ============================================
// 🔌 FONCTIONS DE CONNEXION
// ============================================

/**
 * Connecte à la base de données
 * Appelé au démarrage du serveur
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

/**
 * Déconnecte proprement de la base
 * Appelé à l'arrêt du serveur (graceful shutdown)
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📴 Database disconnected');
}
