/**
 * ==========================================
 * 🤖 ÉCRAN COACH IA
 * ==========================================
 * 
 * Affiche des conseils personnalisés basés sur:
 * - Les stats du joueur
 * - Les quêtes actives
 * - Les habitudes
 * - L'humeur récente
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface Tip {
  icon: string;
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface CoachAdvice {
  greeting: string;
  tips: Tip[];
  motivation: string;
  focus: string;
}

interface CoachContext {
  level: number;
  stats: {
    health: number;
    energy: number;
    wisdom: number;
    social: number;
    wealth: number;
    currentStreak: number;
  };
  questsActive: number;
  questsCompleted: number;
  habitsToday: string;
  mood: number | null;
}

interface CoachResponse {
  advice: CoachAdvice;
  context: CoachContext;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CoachScreen() {
  const [advice, setAdvice] = useState<CoachAdvice | null>(null);
  const [context, setContext] = useState<CoachContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token is handled internally by API module

  // Charger les conseils
  const loadAdvice = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<CoachResponse>('/coach/advice');
      setAdvice(response.advice);
      setContext(response.context);
    } catch (err: any) {
      console.error('Error loading coach advice:', err);
      setError(err.message || 'Erreur lors du chargement des conseils');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdvice();
  }, [loadAdvice]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdvice();
  }, [loadAdvice]);

  // Écran de chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Le coach analyse tes données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😔</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAdvice}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.accent;
      case 'medium': return colors.warning || '#f39c12';
      case 'low': return colors.success;
      default: return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ══════════════════════════════════ */}
        {/* 🤖 HEADER COACH */}
        {/* ══════════════════════════════════ */}
        <View style={styles.header}>
          <Text style={styles.coachAvatar}>🤖</Text>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{advice?.greeting}</Text>
            <Text style={styles.subtitle}>Ton coach personnel</Text>
          </View>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 🎯 FOCUS DU JOUR */}
        {/* ══════════════════════════════════ */}
        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>🎯 Focus du jour</Text>
          <Text style={styles.focusText}>{advice?.focus}</Text>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 💡 CONSEILS */}
        {/* ══════════════════════════════════ */}
        <Text style={styles.sectionTitle}>💡 Mes conseils pour toi</Text>
        
        {advice?.tips.map((tip, index) => (
          <View 
            key={index} 
            style={[
              styles.tipCard,
              { borderLeftColor: getPriorityColor(tip.priority) }
            ]}
          >
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipCategory}>{tip.category}</Text>
              {tip.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>Priorité</Text>
                </View>
              )}
            </View>
            <Text style={styles.tipMessage}>{tip.message}</Text>
          </View>
        ))}

        {/* ══════════════════════════════════ */}
        {/* 📊 RÉSUMÉ */}
        {/* ══════════════════════════════════ */}
        {context && (
          <>
            <Text style={styles.sectionTitle}>📊 Ton résumé</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Niv. {context.level}</Text>
                <Text style={styles.statLabel}>Niveau</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{context.questsActive}</Text>
                <Text style={styles.statLabel}>Quêtes actives</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{context.habitsToday}</Text>
                <Text style={styles.statLabel}>Habitudes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>🔥 {context.stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════════════════════════ */}
        {/* 💪 MOTIVATION */}
        {/* ══════════════════════════════════ */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationIcon}>💪</Text>
          <Text style={styles.motivationText}>{advice?.motivation}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textLight,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  coachAvatar: {
    fontSize: 64,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Focus Card
  focusCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  focusLabel: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  focusText: {
    fontSize: 18,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 16,
    marginTop: 8,
  },

  // Tips
  tipCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tipCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tipMessage: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Motivation
  motivationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  motivationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});
