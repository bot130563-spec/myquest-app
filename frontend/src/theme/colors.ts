/**
 * ==========================================
 * 🎨 MYQUEST - PALETTE DE COULEURS
 * ==========================================
 * 
 * Thème sombre gamifié inspiré des jeux RPG.
 * Toutes les couleurs de l'app sont centralisées ici.
 * 
 * POURQUOI CENTRALISER ?
 * - Cohérence: même couleur partout
 * - Maintenance: changer une couleur = un seul endroit
 * - Thèmes: facile d'ajouter un mode clair plus tard
 * 
 * USAGE:
 * import { colors } from '../theme/colors';
 * style={{ backgroundColor: colors.primary }}
 * 
 * ORGANISATION:
 * 1. Couleurs primaires (fond, structure)
 * 2. Couleurs d'accent (actions, highlights)
 * 3. Couleurs de stats (barres de progression)
 * 4. Couleurs de texte
 * 5. Éléments UI (bordures, ombres)
 * 6. Couleurs de rareté (système RPG)
 */

export const colors = {
  // ============================================
  // 🌙 COULEURS PRIMAIRES - Structure de l'app
  // ============================================
  // Tons bleu-violet sombres pour le fond
  
  primary: '#1a1a2e',      // Fond principal très sombre (presque noir)
  secondary: '#16213e',    // Fond secondaire (cartes, modales)
  tertiary: '#0f3460',     // Accent bleu plus clair (hover, focus)
  
  // Variantes de fond pour créer de la profondeur
  background: '#1a1a2e',        // Fond de l'app
  cardBackground: '#16213e',    // Fond des cartes
  surfaceLight: '#1f2544',      // Surface légèrement surélevée
  
  // ============================================
  // 🔥 COULEURS D'ACCENT - Actions & highlights
  // ============================================
  // Couleurs vives qui attirent l'attention
  
  accent: '#e94560',       // Rouge/rose vif - BOUTONS PRINCIPAUX
  accentLight: '#ff6b6b',  // Version plus claire (hover, gradient)
  
  gold: '#ffc947',         // Or - ACHIEVEMENTS, XP, récompenses
  success: '#00d9a6',      // Vert menthe - Succès, validations
  warning: '#ffb347',      // Orange - Alertes douces
  error: '#ff4757',        // Rouge vif - Erreurs, danger
  
  // ============================================
  // 📊 COULEURS DE STATS - Barres de progression
  // ============================================
  // Chaque stat de vie a sa couleur distinctive
  
  xpBar: '#9b59b6',        // Violet - Expérience générale
  // 7 dimensions de vie (Coach V2)
  bodyBar: '#e74c3c',      // Rouge - Corps 💪
  mindBar: '#3498db',      // Bleu - Esprit 🧠
  wisdomBar: '#9b59b6',    // Violet - Sagesse 📚
  socialBar: '#e91e63',    // Rose - Social 👥
  loveBar: '#ff6b6b',      // Rouge clair - Amour ❤️
  careerBar: '#f39c12',    // Orange - Carrière 🎯
  financeBar: '#27ae60',   // Vert - Finances 💰
  // Alias rétro-compatibles
  healthBar: '#e74c3c',    // Alias → bodyBar
  energyBar: '#3498db',    // Alias → mindBar
  wealthBar: '#f39c12',    // Alias → financeBar
  
  // ============================================
  // 📝 COULEURS DE TEXTE
  // ============================================
  // Hiérarchie visuelle du texte
  
  textLight: '#ffffff',     // Blanc pur - Titres, texte important
  textPrimary: '#eaeaea',   // Blanc cassé - Texte principal
  textSecondary: '#b8b8b8', // Gris clair - Texte secondaire
  textMuted: '#6c757d',     // Gris - Labels, légendes, désactivé
  textDark: '#1a1a2e',      // Sombre - Texte sur fond clair (rare)
  
  // ============================================
  // 🔲 ÉLÉMENTS UI
  // ============================================
  // Bordures, séparateurs, effets
  
  border: '#2d2d44',        // Bordure subtile
  divider: '#2d2d44',       // Ligne de séparation
  shadow: '#000000',        // Ombre (utilisé avec opacity)
  overlay: 'rgba(0, 0, 0, 0.7)', // Fond semi-transparent (modales)
  
  // ============================================
  // 🟢 STATUTS
  // ============================================
  // Indicateurs de présence/état
  
  online: '#00d9a6',        // En ligne - Vert
  offline: '#6c757d',       // Hors ligne - Gris
  busy: '#e94560',          // Occupé - Rouge
  
  // ============================================
  // 💎 COULEURS DE RARETÉ - Système RPG
  // ============================================
  // Pour les objets, achievements, récompenses
  // Inspiré de World of Warcraft / Diablo
  
  rarityCommon: '#b8b8b8',     // Commun - Gris
  rarityUncommon: '#2ecc71',   // Peu commun - Vert
  rarityRare: '#3498db',       // Rare - Bleu
  rarityEpic: '#9b59b6',       // Épique - Violet
  rarityLegendary: '#f39c12',  // Légendaire - Orange/or
  
} as const;  // "as const" rend l'objet readonly et type chaque valeur exactement

// ============================================
// 📝 TYPE TYPESCRIPT
// ============================================
// Permet d'avoir l'autocomplétion des noms de couleurs
// Usage: function getColor(key: ColorKey) { return colors[key]; }

export type ColorKey = keyof typeof colors;

// ============================================
// 🌈 GRADIENTS PRÉDÉFINIS
// ============================================
// Pour les effets de dégradé (LinearGradient de expo)
// Usage: <LinearGradient colors={gradients.primary} />

export const gradients = {
  // Fond général
  primary: ['#1a1a2e', '#16213e'],
  
  // Boutons et highlights
  accent: ['#e94560', '#ff6b6b'],
  gold: ['#ffc947', '#f39c12'],
  success: ['#00d9a6', '#00b894'],
  
  // Barre d'XP
  xp: ['#9b59b6', '#8e44ad'],
} as const;

// ============================================
// 💡 NOTES D'UTILISATION
// ============================================
//
// BONNES PRATIQUES:
// - Toujours utiliser colors.xxx, jamais de couleur en dur
// - Pour le texte: textLight sur fond sombre, textDark sur fond clair
// - Pour les actions: accent pour primaire, secondary pour secondaire
//
// POUR AJOUTER UN MODE CLAIR:
// 1. Créer un objet lightColors similaire
// 2. Utiliser un contexte React pour switcher
// 3. const { colors } = useTheme();
//
// ACCESSIBILITÉ:
// - Contraste minimum de 4.5:1 pour le texte
// - Tester avec des simulateurs de daltonisme
// - Ne pas utiliser la couleur comme seul indicateur
