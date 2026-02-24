/**
 * Configuration globale pour les tests Jest
 * Ce fichier est exécuté avant tous les tests
 */

// Variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3000';
