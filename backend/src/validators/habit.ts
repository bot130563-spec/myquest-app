/**
 * ==========================================
 * ✅ VALIDATION - Schémas Habit
 * ==========================================
 */

import { z } from 'zod';

// ============================================
// 📝 ENUMS
// ============================================

export const HabitFrequency = z.enum([
  'DAILY',      // Tous les jours
  'WEEKLY',     // Certains jours
  'WEEKDAYS',   // Lun-Ven
  'WEEKENDS',   // Sam-Dim
]);

// Réutilise QuestCategory (nouvelles + anciennes catégories)
export const HabitCategory = z.enum([
  'BODY',
  'MIND',
  'WISDOM',
  'SOCIAL',
  'LOVE',
  'CAREER',
  'FINANCE',
  'GENERAL',
  // Anciennes catégories conservées pour compatibilité
  'HEALTH',
  'ENERGY',
  'WEALTH',
]);

// ============================================
// 📝 SCHÉMA CREATE HABIT
// ============================================

export const createHabitSchema = z.object({
  title: z
    .string({ required_error: 'Le titre est requis' })
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre est trop long'),
  
  description: z
    .string()
    .max(500, 'La description est trop longue')
    .optional(),
  
  icon: z
    .string()
    .max(10, 'Emoji trop long')
    .default('⭐'),
  
  category: HabitCategory.default('GENERAL'),
  
  frequency: HabitFrequency.default('DAILY'),
  
  // Jours cibles pour WEEKLY (0=Dim, 1=Lun, ..., 6=Sam)
  targetDays: z
    .array(z.number().min(0).max(6))
    .default([]),
  
  // Combien de fois par période
  targetCount: z
    .number()
    .min(1, 'Minimum 1 fois')
    .max(10, 'Maximum 10 fois')
    .default(1),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

// ============================================
// 📝 SCHÉMA UPDATE HABIT
// ============================================

export const updateHabitSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre est trop long')
    .optional(),
  
  description: z
    .string()
    .max(500)
    .nullable()
    .optional(),
  
  icon: z
    .string()
    .max(10)
    .optional(),
  
  category: HabitCategory.optional(),
  frequency: HabitFrequency.optional(),
  targetDays: z.array(z.number().min(0).max(6)).optional(),
  targetCount: z.number().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

// ============================================
// 📝 SCHÉMA COMPLETE HABIT
// ============================================

export const completeHabitSchema = z.object({
  note: z
    .string()
    .max(200, 'Note trop longue')
    .optional(),
  
  // Permet de compléter pour une date passée (rattrapage)
  date: z
    .string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : new Date()),
});

export type CompleteHabitInput = z.infer<typeof completeHabitSchema>;

// ============================================
// 🛠️ UTILITAIRES
// ============================================

/**
 * Labels français pour les fréquences
 */
export const frequencyLabels: Record<string, string> = {
  DAILY: '📅 Quotidien',
  WEEKLY: '📆 Hebdomadaire',
  WEEKDAYS: '💼 Semaine (Lun-Ven)',
  WEEKENDS: '🌴 Week-end',
};

/**
 * Noms des jours
 */
export const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/**
 * Vérifie si une habitude doit être faite aujourd'hui
 */
export function shouldDoToday(
  frequency: string,
  targetDays: number[]
): boolean {
  const today = new Date().getDay(); // 0=Dim, 1=Lun, ...
  
  switch (frequency) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return today >= 1 && today <= 5;
    case 'WEEKENDS':
      return today === 0 || today === 6;
    case 'WEEKLY':
      return targetDays.includes(today);
    default:
      return true;
  }
}

/**
 * Labels catégories (réutilisé de quest)
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
