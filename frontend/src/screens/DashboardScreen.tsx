/**
 * ==========================================
 * 📊 ÉCRAN DASHBOARD - Vue d'ensemble
 * ==========================================
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface DashboardData {
  avatar: {
    name: string;
    level: number;
    experience: number;
    xpForNextLevel: number;
    xpProgress: number;
  };
  stats: {
    health: number;
    energy: number;
    wisdom: number;
    social: number;
    wealth: number;
    globalScore: number;
    currentStreak: number;
  };
  quests: {
    active: number;
    completed: number;
    upcoming: { id: string; title: string; xpReward: number }[];
  };
  habits: {
    completed: number;
    total: number;
    percentage: number;
    remaining: { id: string; title: string; icon: string }[];
  };
  journal: {
    writtenToday: boolean;
    todayMoodEmoji: string | null;
    streak: number;
  };
  recentActivity: {
    questsCompleted: number;
    habitsCompleted: number;
  };
  tips: string[];
}

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  async function loadDashboard(): Promise<void> {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      setData(response);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh(): void {
    setIsRefreshing(true);
    loadDashboard();
  }

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ═══════════════════════════════════════ */}
        {/* 🦸 AVATAR & NIVEAU */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroName}>{data.avatar.name}</Text>
              <Text style={styles.heroLevel}>Niveau {data.avatar.level}</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{data.stats.globalScore}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
          
          {/* XP Bar */}
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${data.avatar.xpProgress}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {data.avatar.experience} / {data.avatar.xpForNextLevel} XP
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📊 STATS */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Stats de Vie</Text>
          <View style={styles.statsGrid}>
            <MiniStat label="💪 Santé" value={data.stats.health} color={colors.healthBar} />
            <MiniStat label="⚡ Énergie" value={data.stats.energy} color={colors.energyBar} />
            <MiniStat label="📚 Sagesse" value={data.stats.wisdom} color={colors.wisdomBar} />
            <MiniStat label="👥 Social" value={data.stats.social} color={colors.socialBar} />
            <MiniStat label="💰 Finances" value={data.stats.wealth} color={colors.wealthBar} />
          </View>
          {data.stats.currentStreak > 0 && (
            <Text style={styles.streakText}>
              🔥 Streak: {data.stats.currentStreak} jours
            </Text>
          )}
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🔄 HABITUDES DU JOUR */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Habits')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔄 Habitudes du jour</Text>
            <Text style={styles.cardProgress}>
              {data.habits.completed}/{data.habits.total}
            </Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${data.habits.percentage}%` }
              ]} 
            />
          </View>
          
          {data.habits.remaining.length > 0 ? (
            <View style={styles.remainingList}>
              {data.habits.remaining.slice(0, 3).map((h) => (
                <View key={h.id} style={styles.remainingItem}>
                  <Text style={styles.remainingIcon}>{h.icon}</Text>
                  <Text style={styles.remainingText}>{h.title}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.doneText}>✅ Tout est fait!</Text>
          )}
        </TouchableOpacity>

        {/* ═══════════════════════════════════════ */}
        {/* ⚔️ QUÊTES ACTIVES */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Quests')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>⚔️ Quêtes</Text>
            <Text style={styles.cardProgress}>
              {data.quests.active} actives
            </Text>
          </View>
          
          {data.quests.upcoming.length > 0 ? (
            <View style={styles.questsList}>
              {data.quests.upcoming.map((q) => (
                <View key={q.id} style={styles.questItem}>
                  <Text style={styles.questTitle}>{q.title}</Text>
                  <Text style={styles.questXp}>+{q.xpReward} XP</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Aucune quête active</Text>
          )}
        </TouchableOpacity>

        {/* ═══════════════════════════════════════ */}
        {/* 📓 JOURNAL */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Journal')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📓 Journal</Text>
            {data.journal.streak > 0 && (
              <Text style={styles.journalStreak}>
                ✍️ {data.journal.streak}j
              </Text>
            )}
          </View>
          
          {data.journal.writtenToday ? (
            <View style={styles.journalDone}>
              <Text style={styles.journalMood}>{data.journal.todayMoodEmoji}</Text>
              <Text style={styles.journalDoneText}>Écrit aujourd'hui!</Text>
            </View>
          ) : (
            <Text style={styles.journalPrompt}>
              🖊️ Prends 5 minutes pour écrire...
            </Text>
          )}
        </TouchableOpacity>

        {/* ═══════════════════════════════════════ */}
        {/* 💡 CONSEILS */}
        {/* ═══════════════════════════════════════ */}
        {data.tips.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Conseils</Text>
            {data.tips.map((tip, i) => (
              <Text key={i} style={styles.tipText}>{tip}</Text>
            ))}
          </View>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* 📈 ACTIVITÉ 7 JOURS */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>📈 Cette semaine</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{data.recentActivity.questsCompleted}</Text>
              <Text style={styles.activityLabel}>Quêtes</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{data.recentActivity.habitsCompleted}</Text>
              <Text style={styles.activityLabel}>Habitudes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT MINI STAT
// ============================================

interface MiniStatProps {
  label: string;
  value: number;
  color: string;
}

function MiniStat({ label, value, color }: MiniStatProps) {
  return (
    <View style={styles.miniStat}>
      <View style={styles.miniStatHeader}>
        <Text style={styles.miniStatLabel}>{label}</Text>
        <Text style={styles.miniStatValue}>{value}</Text>
      </View>
      <View style={styles.miniStatBarBg}>
        <View style={[styles.miniStatBarFill, { width: `${value}%`, backgroundColor: color }]} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  
  // Hero Card
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  heroLevel: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '600',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  xpContainer: {
    gap: 4,
  },
  xpBarBg: {
    height: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 4,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  
  // Cards
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  cardProgress: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '600',
  },
  
  // Stats Grid
  statsGrid: {
    gap: 8,
  },
  miniStat: {
    marginBottom: 4,
  },
  miniStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  miniStatBarBg: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
  },
  miniStatBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  streakText: {
    textAlign: 'center',
    marginTop: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  
  // Progress Bar
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  
  // Remaining Habits
  remainingList: {
    gap: 8,
  },
  remainingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remainingIcon: {
    fontSize: 20,
  },
  remainingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  doneText: {
    color: colors.success,
    fontWeight: '600',
  },
  
  // Quests
  questsList: {
    gap: 8,
  },
  questItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  questXp: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Journal
  journalStreak: {
    fontSize: 14,
    color: colors.success,
  },
  journalDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journalMood: {
    fontSize: 24,
  },
  journalDoneText: {
    color: colors.success,
    fontWeight: '600',
  },
  journalPrompt: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Tips
  tipsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  
  // Activity
  activityCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  activityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  activityLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});
