/**
 * ==========================================
 * 🏆 ÉCRAN ACHIEVEMENTS
 * ==========================================
 * 
 * Affiche tous les badges et accomplissements.
 * Les achievements débloqués sont mis en évidence.
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
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  percentage: number;
  totalXpEarned: number;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);

  // Charger les achievements
  const loadAchievements = useCallback(async () => {
    try {
      const response = await api.get<{ achievements: Achievement[]; stats: AchievementStats }>('/achievements');
      setAchievements(response.achievements);
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Vérifier les nouveaux achievements
  const checkAchievements = async () => {
    setChecking(true);
    try {
      const response = await api.post<{ newlyUnlocked: any[]; totalUnlocked: number }>('/achievements/check');
      if (response.newlyUnlocked.length > 0) {
        setNewlyUnlocked(response.newlyUnlocked);
        // Recharger la liste
        await loadAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAchievements();
  }, [loadAchievements]);

  // Grouper par catégorie
  const categories = [
    { id: 'streak', name: '🔥 Streaks', achievements: achievements.filter(a => a.category === 'streak') },
    { id: 'quests', name: '⚔️ Quêtes', achievements: achievements.filter(a => a.category === 'quests') },
    { id: 'habits', name: '🔄 Habitudes', achievements: achievements.filter(a => a.category === 'habits') },
    { id: 'journal', name: '📓 Journal', achievements: achievements.filter(a => a.category === 'journal') },
    { id: 'stats', name: '📊 Stats', achievements: achievements.filter(a => a.category === 'stats') },
    { id: 'special', name: '⭐ Spécial', achievements: achievements.filter(a => a.category === 'special') },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Chargement des trophées...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* 🏆 HEADER */}
        {/* ══════════════════════════════════ */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Achievements</Text>
          <Text style={styles.subtitle}>Tes accomplissements de héros</Text>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 📊 STATS */}
        {/* ══════════════════════════════════ */}
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.unlocked}/{stats.total}</Text>
              <Text style={styles.statLabel}>Débloqués</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.percentage}%</Text>
              <Text style={styles.statLabel}>Complétion</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalXpEarned}</Text>
              <Text style={styles.statLabel}>XP gagnés</Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 🔍 BOUTON CHECK */}
        {/* ══════════════════════════════════ */}
        <TouchableOpacity
          style={[styles.checkButton, checking && styles.checkButtonDisabled]}
          onPress={checkAchievements}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator size="small" color={colors.textLight} />
          ) : (
            <Text style={styles.checkButtonText}>🔍 Vérifier mes achievements</Text>
          )}
        </TouchableOpacity>

        {/* ══════════════════════════════════ */}
        {/* 🆕 NOUVEAUX DÉBLOQUÉS */}
        {/* ══════════════════════════════════ */}
        {newlyUnlocked.length > 0 && (
          <View style={styles.newlyUnlockedCard}>
            <Text style={styles.newlyUnlockedTitle}>🎉 Nouveaux achievements !</Text>
            {newlyUnlocked.map(a => (
              <View key={a.id} style={styles.newAchievement}>
                <Text style={styles.newAchievementIcon}>{a.icon}</Text>
                <View style={styles.newAchievementInfo}>
                  <Text style={styles.newAchievementName}>{a.name}</Text>
                  <Text style={styles.newAchievementXp}>+{a.xpReward} XP</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => setNewlyUnlocked([])}>
              <Text style={styles.dismissText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 📋 LISTE PAR CATÉGORIE */}
        {/* ══════════════════════════════════ */}
        {categories.map(cat => (
          cat.achievements.length > 0 && (
            <View key={cat.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{cat.name}</Text>
              <View style={styles.achievementsGrid}>
                {cat.achievements.map(achievement => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      !achievement.unlocked && styles.achievementLocked
                    ]}
                  >
                    <Text style={[
                      styles.achievementIcon,
                      !achievement.unlocked && styles.achievementIconLocked
                    ]}>
                      {achievement.icon}
                    </Text>
                    <Text style={[
                      styles.achievementName,
                      !achievement.unlocked && styles.achievementNameLocked
                    ]}>
                      {achievement.name}
                    </Text>
                    <Text style={styles.achievementDesc}>
                      {achievement.description}
                    </Text>
                    <Text style={styles.achievementXp}>
                      {achievement.unlocked ? '✅' : `+${achievement.xpReward} XP`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )
        ))}

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

  // Loading
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

  // Header
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Check Button
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  checkButtonDisabled: {
    opacity: 0.7,
  },
  checkButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },

  // Newly Unlocked
  newlyUnlockedCard: {
    backgroundColor: colors.success + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.success,
  },
  newlyUnlockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 12,
  },
  newAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  newAchievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  newAchievementInfo: {
    flex: 1,
  },
  newAchievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  newAchievementXp: {
    fontSize: 14,
    color: colors.success,
  },
  dismissText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Category
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Achievement Card
  achievementCard: {
    width: '47%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementIconLocked: {
    opacity: 0.3,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: colors.textMuted,
  },
  achievementDesc: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementXp: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
});
