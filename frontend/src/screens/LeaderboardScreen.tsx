/**
 * ==========================================
 * 🏆 ÉCRAN LEADERBOARD - Classement
 * ==========================================
 *
 * Affiche le top 10 des utilisateurs par XP total
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarName: string;
  avatarType: string;
  level: number;
  totalXp: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: {
    rank: number;
    totalUsers: number;
  };
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function LeaderboardScreen() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard(): Promise<void> {
    try {
      const response = await api.get<LeaderboardData>('/leaderboard');
      setData(response);
    } catch (error) {
      console.error('Load leaderboard error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh(): void {
    setIsRefreshing(true);
    loadLeaderboard();
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const currentUserRank = data?.currentUser.rank || 0;
  const totalUsers = data?.currentUser.totalUsers || 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ═══════════════════════════════════════ */}
      {/* 📊 HEADER - Mon rang */}
      {/* ═══════════════════════════════════════ */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Classement Mondial</Text>
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>Ton rang</Text>
          <Text style={styles.myRankValue}>
            #{currentUserRank} / {totalUsers}
          </Text>
        </View>
      </View>

      {/* ═══════════════════════════════════════ */}
      {/* 📋 LISTE DU LEADERBOARD */}
      {/* ═══════════════════════════════════════ */}
      <FlatList
        data={data?.leaderboard || []}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>Pas encore de classement</Text>
          </View>
        }
        renderItem={({ item }) => (
          <LeaderboardCard entry={item} />
        )}
      />
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT LEADERBOARD CARD
// ============================================

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
}

function LeaderboardCard({ entry }: LeaderboardCardProps) {
  const isTop3 = entry.rank <= 3;
  const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';

  return (
    <View style={[
      styles.card,
      isTop3 && styles.cardTop3,
      entry.isCurrentUser && styles.cardCurrentUser,
    ]}>
      {/* Rang */}
      <View style={styles.rankContainer}>
        {medalEmoji ? (
          <Text style={styles.medalEmoji}>{medalEmoji}</Text>
        ) : (
          <Text style={styles.rankText}>#{entry.rank}</Text>
        )}
      </View>

      {/* Info utilisateur */}
      <View style={styles.userInfo}>
        <Text style={styles.username}>
          {entry.username}
          {entry.isCurrentUser && ' (toi)'}
        </Text>
        <Text style={styles.avatarName}>{entry.avatarName}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.level}>Niv. {entry.level}</Text>
        <Text style={styles.xp}>{entry.totalXp.toLocaleString()} XP</Text>
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

  // Header
  header: {
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  myRankCard: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  myRankLabel: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.8,
    marginBottom: 4,
  },
  myRankValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textLight,
  },

  // Card
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTop3: {
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  cardCurrentUser: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
  medalEmoji: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  level: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  xp: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: '500',
  },
});
