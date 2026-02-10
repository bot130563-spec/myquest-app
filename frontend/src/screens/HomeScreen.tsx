/**
 * ==========================================
 * 🏠 HOMESCREEN - Écran d'accueil
 * ==========================================
 * 
 * L'écran principal que l'utilisateur voit après connexion.
 * Affiche un résumé de son état et des actions rapides.
 * 
 * SECTIONS:
 * 1. Hero: Message de bienvenue personnalisé
 * 2. Stats: Aperçu niveau/XP/streak
 * 3. Actions: Boutons pour les actions fréquentes
 * 4. Quote: Citation motivante du jour
 * 
 * COMPOSANTS:
 * - StatItem: Petit composant réutilisable pour une stat
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,  // Bouton avec effet tactile
  ScrollView,        // Permet de scroller si contenu dépasse
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================
export default function HomeScreen() {
  // TODO: Récupérer les vraies données depuis l'API
  // const { user, avatar, stats } = useUser();
  
  return (
    // SafeAreaView évite que le contenu passe sous la barre de navigation iOS
    // edges={['bottom']} = protection seulement en bas (le header gère le haut)
    <SafeAreaView style={styles.container} edges={['bottom']}>
      
      {/* ScrollView permet de scroller si le contenu dépasse l'écran */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ═══════════════════════════════════════ */}
        {/* 👋 SECTION HERO - Bienvenue */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.heroSection}>
          {/* TODO: Remplacer "Héros" par le vrai nom de l'avatar */}
          <Text style={styles.welcomeText}>Bienvenue, Héros!</Text>
          <Text style={styles.subtitle}>Prêt pour ta prochaine quête?</Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📊 CARTE STATS - Résumé progression */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Tes Stats</Text>
          
          {/* Grille 2x2 de stats */}
          <View style={styles.statsGrid}>
            {/* TODO: Remplacer les valeurs en dur par avatar.level, etc. */}
            <StatItem label="Niveau" value="1" icon="⭐" />
            <StatItem label="XP" value="0/100" icon="✨" />
            <StatItem label="Streak" value="0 jours" icon="🔥" />
            <StatItem label="Quêtes" value="0" icon="⚔️" />
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🎯 CARTE ACTIONS - Boutons rapides */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Actions Rapides</Text>
          
          {/* Bouton principal (accent color) */}
          {/* TODO: navigation.navigate('NewQuest') */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>+ Nouvelle Quête</Text>
          </TouchableOpacity>
          
          {/* Bouton secondaire (outline style) */}
          {/* TODO: navigation.navigate('Avatar') */}
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>Voir mon Avatar</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 💬 CARTE CITATION - Motivation */}
        {/* ═══════════════════════════════════════ */}
        {/* TODO: Récupérer une citation aléatoire depuis l'API ou localement */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Chaque jour est une nouvelle opportunité de devenir la meilleure version de toi-même."
          </Text>
          <Text style={styles.quoteAuthor}>— MyQuest</Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT STATITEM - Une stat individuelle
// ============================================
// Composant réutilisable pour afficher une statistique
// Props:
// - label: texte sous la valeur ("Niveau", "XP", etc.)
// - value: valeur à afficher ("1", "0/100", etc.)
// - icon: emoji décoratif

function StatItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statItem}>
      {/* Emoji en haut */}
      <Text style={styles.statIcon}>{icon}</Text>
      {/* Valeur en gros */}
      <Text style={styles.statValue}>{value}</Text>
      {/* Label en petit dessous */}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// 🎨 STYLES - Définition des styles
// ============================================
// StyleSheet.create() optimise les styles (les compile une seule fois)
// Similaire au CSS mais en camelCase

const styles = StyleSheet.create({
  // ── CONTAINER PRINCIPAL ──
  container: {
    flex: 1,                           // Prend tout l'espace disponible
    backgroundColor: colors.background, // Fond sombre
  },
  
  // ── SCROLL CONTENT ──
  scrollContent: {
    padding: 20,  // Marge intérieure autour de tout le contenu
  },
  
  // ── SECTION HERO ──
  heroSection: {
    alignItems: 'center',    // Centre horizontalement
    marginBottom: 24,        // Espace en bas
    paddingVertical: 20,     // Padding haut/bas
  },
  welcomeText: {
    fontSize: 28,            // Grande taille
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted, // Gris atténué
  },
  
  // ── CARTES (conteneurs de section) ──
  card: {
    backgroundColor: colors.cardBackground,  // Légèrement plus clair que le fond
    borderRadius: 16,                        // Coins arrondis
    padding: 20,
    marginBottom: 16,                        // Espace entre les cartes
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',       // Semi-bold
    color: colors.textLight,
    marginBottom: 16,        // Espace avant le contenu
  },
  
  // ── GRILLE DE STATS ──
  statsGrid: {
    flexDirection: 'row',    // Éléments côte à côte
    flexWrap: 'wrap',        // Passe à la ligne si nécessaire
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',            // Presque la moitié (2 par ligne)
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',    // Centre le contenu
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,            // Emoji taille
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  
  // ── BOUTONS D'ACTION ──
  actionButton: {
    backgroundColor: colors.accent,  // Rouge/rose vif
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modificateur pour bouton secondaire (style outline)
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ── CARTE CITATION ──
  quoteCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderLeftWidth: 4,             // Barre décorative à gauche
    borderLeftColor: colors.gold,   // Dorée
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textLight,
    lineHeight: 24,          // Espacement entre lignes
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',      // Aligné à droite
  },
});

// ============================================
// 📝 NOTES POUR LA SUITE
// ============================================
//
// AMÉLIORATIONS POSSIBLES:
// - Ajouter des animations (react-native-reanimated)
// - Pull-to-refresh pour recharger les données
// - Skeleton loading pendant le chargement
// - Navigation vers les détails au tap sur une stat
// - Système de notifications pour les rappels
