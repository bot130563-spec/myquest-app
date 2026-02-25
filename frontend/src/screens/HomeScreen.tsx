/**
 * ==========================================
 * 🏠 HOMESCREEN - Écran d'accueil
 * ==========================================
 * 
 * L'écran principal que l'utilisateur voit après connexion.
 * Affiche un résumé de son état et des actions rapides.
 * 
 * DONNÉES AFFICHÉES:
 * - Nom de l'avatar depuis le contexte auth
 * - Niveau et XP
 * - Stats principales
 * - Actions rapides
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// 📦 TYPES
// ============================================

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // Récupère les données utilisateur depuis le contexte
  const { user, logout } = useAuth();
  
  // Raccourcis pour les données
  const avatar = user?.avatar;
  const stats = user?.stats;
  
  // Calcul XP pour le prochain niveau
  const xpForNextLevel = (avatar?.level || 1) * 100;
  const xpProgress = avatar ? Math.round((avatar.experience / xpForNextLevel) * 100) : 0;

  /**
   * Gère la déconnexion
   */
  function handleLogout(): void {
    Alert.alert(
      'Déconnexion',
      'Tu veux vraiment quitter l\'aventure?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ═══════════════════════════════════════ */}
        {/* 👋 SECTION HERO - Bienvenue */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.heroSection}>
          <Text style={styles.welcomeText}>
            Bienvenue, {avatar?.name || 'Héros'}!
          </Text>
          <Text style={styles.subtitle}>Prêt pour ta prochaine quête?</Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📊 CARTE PROGRESSION - Niveau & XP */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelBadge}>Niv. {avatar?.level || 1}</Text>
            <View style={styles.avatarTypeContainer}>
              <Ionicons name="shield" size={16} color={colors.textSecondary} />
              <Text style={styles.avatarType}>
                {avatar?.avatarType === 'warrior' ? 'Guerrier' :
                 avatar?.avatarType === 'mage' ? 'Mage' :
                 avatar?.avatarType === 'healer' ? 'Soigneur' : 'Guerrier'}
              </Text>
            </View>
          </View>
          
          {/* Barre de progression XP */}
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
            </View>
            <View style={styles.xpTextContainer}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.xpText}>
                {avatar?.experience || 0} / {xpForNextLevel} XP
              </Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📊 CARTE STATS - Statistiques de vie */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="stats-chart" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Tes Stats de Vie</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatBar
              label="Santé"
              value={stats?.health || 50}
              color={colors.healthBar}
              icon="fitness"
            />
            <StatBar
              label="Énergie"
              value={stats?.energy || 50}
              color={colors.energyBar}
              icon="flash"
            />
            <StatBar
              label="Sagesse"
              value={stats?.wisdom || 50}
              color={colors.wisdomBar}
              icon="book"
            />
            <StatBar
              label="Social"
              value={stats?.social || 50}
              color={colors.socialBar}
              icon="people"
            />
            <StatBar
              label="Finances"
              value={stats?.wealth || 50}
              color={colors.wealthBar}
              icon="cash"
            />
          </View>
          
          {/* Streak */}
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons name="fire" size={24} color={colors.accent} />
            <Text style={styles.streakText}>
              Streak: {stats?.currentStreak || 0} jour{(stats?.currentStreak || 0) > 1 ? 's' : ''}
            </Text>
            <Text style={styles.streakRecord}>
              (Record: {stats?.longestStreak || 0})
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🎯 CARTE ACTIONS - Boutons rapides */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="rocket" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Actions Rapides</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Habits')}
          >
            <Ionicons name="repeat" size={20} color={colors.textLight} />
            <Text style={styles.actionButtonText}>Habitudes du jour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Quests')}
          >
            <Ionicons name="flag" size={20} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Mes Quêtes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('CreateQuest')}
          >
            <Ionicons name="add-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Nouvelle Quête</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 💬 CARTE CITATION - Motivation */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Chaque jour est une nouvelle opportunité de devenir la meilleure version de toi-même."
          </Text>
          <Text style={styles.quoteAuthor}>— MyQuest</Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🚪 DÉCONNEXION */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT STATBAR - Barre de stat
// ============================================

interface StatBarProps {
  label: string;
  value: number;  // 0-100
  color: string;
  icon: string;
}

function StatBar({ label, value, color, icon }: StatBarProps) {
  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarHeader}>
        <View style={styles.statBarLabelContainer}>
          <Ionicons name={icon as any} size={16} color={color} />
          <Text style={styles.statBarLabel}>{label}</Text>
        </View>
        <Text style={styles.statBarValue}>{value}</Text>
      </View>
      <View style={styles.statBarBackground}>
        <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ============================================
// 🎨 STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  
  // Cards
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  
  // Level & XP
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: colors.gold,
    color: colors.textDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontWeight: 'bold',
    fontSize: 16,
    overflow: 'hidden',
  },
  avatarTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarType: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  xpContainer: {
    gap: 8,
  },
  xpBarBackground: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 6,
  },
  xpTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  
  // Stats Grid
  statsGrid: {
    gap: 12,
  },
  statBarContainer: {
    marginBottom: 4,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBarLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  statBarValue: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  statBarBackground: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Streak
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  streakText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  streakRecord: {
    color: colors.textMuted,
    fontSize: 14,
  },
  
  // Actions
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Quote
  quoteCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textLight,
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    marginBottom: 20,
  },
  logoutText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
