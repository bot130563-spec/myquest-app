/**
 * ==========================================
 * ✅ VALIDATION - Schémas Journal
 * ==========================================
 */

import { z } from 'zod';

// ============================================
// 📝 SCHÉMA CREATE/UPDATE JOURNAL ENTRY
// ============================================

export const journalEntrySchema = z.object({
  // Humeur (1-5): 1=très mal, 5=excellent
  mood: z
    .number()
    .min(1, 'Humeur minimum: 1')
    .max(5, 'Humeur maximum: 5')
    .default(3),
  
  // Contenu principal
  content: z
    .string()
    .max(5000, 'Contenu trop long (max 5000 caractères)')
    .optional()
    .nullable(),
  
  // Gratitudes (array de strings)
  gratitudes: z
    .array(z.string().max(200))
    .max(10, 'Maximum 10 gratitudes')
    .default([]),
  
  // Objectif du jour
  dailyGoal: z
    .string()
    .max(500, 'Objectif trop long')
    .optional()
    .nullable(),
  
  // Réflexion/leçon
  reflection: z
    .string()
    .max(2000, 'Réflexion trop longue')
    .optional()
    .nullable(),
  
  // Tags
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags')
    .default([]),
  
  // Date de l'entrée (optionnel, défaut = aujourd'hui)
  entryDate: z
    .string()
    .datetime()
    .optional()
    .transform(val => {
      const date = val ? new Date(val) : new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    }),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

// ============================================
// 🛠️ UTILITAIRES
// ============================================

/**
 * Emojis pour les humeurs
 */
export const moodEmojis: Record<number, string> = {
  1: '😢',  // Très mal
  2: '😔',  // Pas bien
  3: '😐',  // Neutre
  4: '🙂',  // Bien
  5: '😄',  // Excellent
};

/**
 * Labels pour les humeurs
 */
export const moodLabels: Record<number, string> = {
  1: 'Très difficile',
  2: 'Difficile',
  3: 'Neutre',
  4: 'Bon',
  5: 'Excellent',
};

/**
 * Prompts/questions pour le journal
 */
export const journalPrompts = {
  gratitude: [
    "Qu'est-ce qui t'a rendu reconnaissant aujourd'hui?",
    "Quelles petites choses t'ont fait sourire?",
    "Qui t'a aidé ou soutenu récemment?",
  ],
  reflection: [
    "Qu'as-tu appris aujourd'hui?",
    "Qu'aurais-tu pu faire différemment?",
    "De quoi es-tu le plus fier?",
  ],
  dailyGoal: [
    "Quelle est ta priorité pour demain?",
    "Sur quoi veux-tu te concentrer?",
    "Quel petit pas peux-tu faire vers ton objectif?",
  ],
};
