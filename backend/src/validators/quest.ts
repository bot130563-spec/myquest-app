/**
 * ==========================================
 * ✅ VALIDATION - Schémas Quest
 * ==========================================
 * 
 * Valide les données des quêtes avec Zod.
 */

import { z } from 'zod';

// ============================================
// 📝 ENUMS (doivent matcher Prisma)
// ============================================

export const QuestCategory = z.enum([
  'BODY',     // 💪 Corps
  'MIND',     // 🧠 Esprit
  'WISDOM',   // 📚 Sagesse
  'SOCIAL',   // 👥 Social
  'LOVE',     // ❤️ Amour
  'CAREER',   // 🎯 Carrière
  'FINANCE',  // 💰 Finances
  'GENERAL',  // ⭐ Général
  // Anciennes catégories conservées pour compatibilité
  'HEALTH',
  'ENERGY',
  'WEALTH',
]);

export const QuestDifficulty = z.enum([
  'EASY',     // Facile
  'MEDIUM',   // Moyen
  'HARD',     // Difficile
  'EPIC',     // Épique
]);

export const QuestStatus = z.enum([
  'ACTIVE',
  'COMPLETED',
  'FAILED',
  'ABANDONED',
]);

// ============================================
// 📝 SCHÉMA CREATE QUEST
// ============================================

export const createQuestSchema = z.object({
  // Titre obligatoire
  title: z
    .string({
      required_error: 'Le titre est requis',
    })
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre est trop long'),
  
  // Description optionnelle
  description: z
    .string()
    .max(500, 'La description est trop longue')
    .optional(),
  
  // Catégorie (défaut: GENERAL)
  category: QuestCategory.default('GENERAL'),
  
  // Difficulté (défaut: MEDIUM)
  difficulty: QuestDifficulty.default('MEDIUM'),
  
  // Date limite optionnelle (format ISO)
  dueDate: z
    .string()
    .datetime({ message: 'Format de date invalide' })
    .optional()
    .transform(val => val ? new Date(val) : undefined),
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>;

// ============================================
// 📝 SCHÉMA UPDATE QUEST
// ============================================

export const updateQuestSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre est trop long')
    .optional(),
  
  description: z
    .string()
    .max(500, 'La description est trop longue')
    .nullable()
    .optional(),
  
  category: QuestCategory.optional(),
  difficulty: QuestDifficulty.optional(),
  
  dueDate: z
    .string()
    .datetime({ message: 'Format de date invalide' })
    .nullable()
    .optional()
    .transform(val => val ? new Date(val) : val === null ? null : undefined),
});

export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;

// ============================================
// 🛠️ UTILITAIRES
// ============================================

/**
 * Calcule les récompenses selon la difficulté
 */
export function getRewardsByDifficulty(difficulty: string): { xp: number; statBoost: number } {
  switch (difficulty) {
    case 'EASY':
      return { xp: 15, statBoost: 1 };
    case 'MEDIUM':
      return { xp: 25, statBoost: 2 };
    case 'HARD':
      return { xp: 50, statBoost: 5 };
    case 'EPIC':
      return { xp: 100, statBoost: 10 };
    default:
      return { xp: 25, statBoost: 2 };
  }
}

/**
 * Labels français pour les catégories
 */
export const categoryLabels: Record<string, string> = {
  BODY: '💪 Corps',
  MIND: '🧠 Esprit',
  WISDOM: '📚 Sagesse',
  SOCIAL: '👥 Social',
  LOVE: '❤️ Amour',
  CAREER: '🎯 Carrière',
  FINANCE: '💰 Finances',
  GENERAL: '⭐ Général',
  // Anciennes catégories
  HEALTH: '💪 Santé',
  ENERGY: '⚡ Énergie',
  WEALTH: '💰 Finances',
};

/**
 * Labels français pour les difficultés
 */
export const difficultyLabels: Record<string, string> = {
  EASY: '🟢 Facile',
  MEDIUM: '🟡 Moyen',
  HARD: '🟠 Difficile',
  EPIC: '🟣 Épique',
};
