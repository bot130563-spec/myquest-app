/**
 * ==========================================
 * ⚙️ CONFIGURATION ENVIRONNEMENT
 * ==========================================
 * 
 * Centralise et valide toutes les variables d'environnement.
 * Si une variable requise manque, l'app crash au démarrage
 * (mieux que de crasher plus tard avec une erreur obscure).
 */

import dotenv from 'dotenv';

// Charge le fichier .env
dotenv.config();

// ============================================
// 🔧 CONFIGURATION EXPORTÉE
// ============================================
export const config = {
  // Environnement (development, production, test)
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Port du serveur
  port: parseInt(process.env.PORT || '3000', 10),
  
  // URL de la base de données PostgreSQL
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Configuration JWT
  jwt: {
    // Clé secrète pour signer les tokens
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    // Durée de validité (format: 1d, 7d, 1h, etc.)
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Est-ce qu'on est en production ?
  isProduction: process.env.NODE_ENV === 'production',
  
  // Est-ce qu'on est en développement ?
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// ============================================
// ✅ VALIDATION AU DÉMARRAGE
// ============================================
// Vérifie que les variables critiques sont définies

export function validateEnv(): void {
  const errors: string[] = [];
  
  // En production, ces variables sont OBLIGATOIRES
  if (config.isProduction) {
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
  }
  
  // Si des erreurs, on crash avec un message clair
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Environment configuration validated');
}
