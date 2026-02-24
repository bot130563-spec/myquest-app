/**
 * Configuration Jest pour MyQuest Backend
 * Utilise ts-jest pour transpiler TypeScript à la volée
 */

module.exports = {
  // Utilise ts-jest pour transformer les fichiers TypeScript
  preset: 'ts-jest',

  // Environnement Node.js (pas browser)
  testEnvironment: 'node',

  // Répertoires des tests
  roots: ['<rootDir>/src'],

  // Pattern des fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Extensions à reconnaître
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
  ],

  // Timeout pour les tests (5 secondes)
  testTimeout: 5000,

  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],

  // Affichage détaillé
  verbose: true,
};
