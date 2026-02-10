/**
 * ==========================================
 * ✅ VALIDATION - Schémas Auth
 * ==========================================
 * 
 * Utilise Zod pour valider les données entrantes.
 * Si les données sont invalides, on retourne une erreur 400
 * avec un message clair.
 * 
 * POURQUOI VALIDER ?
 * - Sécurité: évite les injections et données malformées
 * - UX: messages d'erreur précis pour l'utilisateur
 * - Types: Zod génère les types TypeScript automatiquement
 */

import { z } from 'zod';

// ============================================
// 📝 SCHÉMA REGISTER - Inscription
// ============================================

export const registerSchema = z.object({
  // Email: doit être un email valide
  email: z
    .string({
      required_error: "L'email est requis",
    })
    .email("Format d'email invalide")
    .toLowerCase()  // Normalise en minuscules
    .trim(),        // Supprime les espaces
  
  // Mot de passe: minimum 8 caractères
  password: z
    .string({
      required_error: 'Le mot de passe est requis',
    })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long'),
  
  // Nom (optionnel): entre 2 et 50 caractères si fourni
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long')
    .trim()
    .optional(),
  
  // Nom de l'avatar (optionnel): nom du personnage
  avatarName: z
    .string()
    .min(2, "Le nom d'avatar doit contenir au moins 2 caractères")
    .max(30, "Le nom d'avatar est trop long")
    .trim()
    .optional(),
});

// Type TypeScript généré automatiquement depuis le schéma
export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// 🔑 SCHÉMA LOGIN - Connexion
// ============================================

export const loginSchema = z.object({
  // Email: requis et valide
  email: z
    .string({
      required_error: "L'email est requis",
    })
    .email("Format d'email invalide")
    .toLowerCase()
    .trim(),
  
  // Mot de passe: requis
  password: z
    .string({
      required_error: 'Le mot de passe est requis',
    })
    .min(1, 'Le mot de passe est requis'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// 🛠️ FONCTION UTILITAIRE: VALIDER
// ============================================

/**
 * Valide des données avec un schéma Zod
 * @returns { success: true, data } ou { success: false, errors }
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Extrait les messages d'erreur de Zod
  const errors = result.error.errors.map(err => {
    // Format: "champ: message" ou juste "message"
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
}
