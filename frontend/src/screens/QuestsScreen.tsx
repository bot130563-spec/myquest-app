/**
 * ==========================================
 * ⚔️ ÉCRAN LISTE DES QUÊTES
 * ==========================================
 * 
 * Affiche toutes les quêtes de l'utilisateur.
 * Permet de filtrer, créer et compléter des quêtes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api, ApiError } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface Quest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  categoryLabel: string;
  difficulty: string;
  difficultyLabel: string;
  status: string;
  xpReward: number;
  statBoost: number;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface QuestsResponse {
  quests: Quest[];
  count: number;
  stats: {
    active: number;
    completed: number;
    failed: number;
    abandoned: number;
  };
}

interface CompleteResponse {
  message: string;
  rewards: {
    xp: number;
    statBoost: number;
    statAffected: string | null;
  };
  levelUp: boolean;
  newLevel: number;
}

type QuestsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function QuestsScreen({ navigation }: QuestsScreenProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, failed: 0, abandoned: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null); // null = toutes

  // Charge les quêtes au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadQuests();
    }, [filter])
  );

  /**
   * Charge les quêtes depuis l'API
   */
  async function loadQuests(): Promise<void> {
    try {
      const endpoint = filter ? `/quests?status=${filter}` : '/quests';
      const response = await api.get<QuestsResponse>(endpoint);
      setQuests(response.quests);
      setStats(response.stats);
    } catch (error) {
      console.error('Load quests error:', error);
      Alert.alert('Erreur', 'Impossible de charger les quêtes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  /**
   * Rafraîchit les quêtes (pull-to-refresh)
   */
  function handleRefresh(): void {
    setIsRefreshing(true);
    loadQuests();
  }

  /**
   * Complète une quête
   */
  async function handleComplete(quest: Quest): Promise<void> {
    Alert.alert(
      'Compléter la quête?',
      `"${quest.title}"\n\nRécompenses: +${quest.xpReward} XP`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Compléter',
          onPress: async () => {
            try {
              const response = await api.post<CompleteResponse>(`/quests/${quest.id}/complete`);
              
              // Message de succès
              let message = response.message;
              if (response.levelUp) {
                Alert.alert('🎉 LEVEL UP!', message);
              } else {
                Alert.alert('✅ Quête accomplie!', message);
              }
              
              // Recharge la liste
              loadQuests();
              
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : 'Erreur';
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  }

  /**
   * Abandonne une quête
   */
  async function handleAbandon(quest: Quest): Promise<void> {
    Alert.alert(
      'Abandonner la quête?',
      `"${quest.title}"\n\n⚠️ Ton streak sera réinitialisé!`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '🏳️ Abandonner',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/quests/${quest.id}/abandon`);
              Alert.alert('Quête abandonnée', 'Ne baisse pas les bras! 💪');
              loadQuests();
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : 'Erreur';
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  }

  // ── ÉCRAN DE CHARGEMENT ──
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ═══════════════════════════════════════ */}
      {/* 📊 STATS RÉSUMÉ */}
      {/* ═══════════════════════════════════════ */}
      <View style={styles.statsBar}>
        <StatBadge 
          label="Actives" 
          value={stats.active} 
          color={colors.accent}
          active={filter === 'ACTIVE'}
          onPress={() => setFilter(filter === 'ACTIVE' ? null : 'ACTIVE')}
        />
        <StatBadge 
          label="Terminées" 
          value={stats.completed} 
          color={colors.success}
          active={filter === 'COMPLETED'}
          onPress={() => setFilter(filter === 'COMPLETED' ? null : 'COMPLETED')}
        />
        <StatBadge 
          label="Toutes" 
          value={stats.active + stats.completed + stats.failed + stats.abandoned} 
          color={colors.textMuted}
          active={filter === null}
          onPress={() => setFilter(null)}
        />
      </View>

      {/* ═══════════════════════════════════════ */}
      {/* 📋 LISTE DES QUÊTES */}
      {/* ═══════════════════════════════════════ */}
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
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
            <Text style={styles.emptyIcon}>⚔️</Text>
            <Text style={styles.emptyText}>Aucune quête pour le moment</Text>
            <Text style={styles.emptySubtext}>Crée ta première quête!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <QuestCard
            quest={item}
            onComplete={() => handleComplete(item)}
            onAbandon={() => handleAbandon(item)}
          />
        )}
      />

      {/* ═══════════════════════════════════════ */}
      {/* ➕ BOUTON CRÉER */}
      {/* ═══════════════════════════════════════ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateQuest')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT STAT BADGE
// ============================================

interface StatBadgeProps {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onPress: () => void;
}

function StatBadge({ label, value, color, active, onPress }: StatBadgeProps) {
  return (
    <TouchableOpacity
      style={[
        styles.statBadge,
        active && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.statBadgeValue, active && { color: colors.textLight }]}>
        {value}
      </Text>
      <Text style={[styles.statBadgeLabel, active && { color: colors.textLight }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// 📦 COMPOSANT QUEST CARD
// ============================================

interface QuestCardProps {
  quest: Quest;
  onComplete: () => void;
  onAbandon: () => void;
}

function QuestCard({ quest, onComplete, onAbandon }: QuestCardProps) {
  const isActive = quest.status === 'ACTIVE';
  const isCompleted = quest.status === 'COMPLETED';
  
  // Couleur de difficulté
  const difficultyColor = {
    EASY: colors.success,
    MEDIUM: colors.warning,
    HARD: colors.accent,
    EPIC: colors.rarityEpic,
  }[quest.difficulty] || colors.textMuted;

  return (
    <View style={[styles.questCard, !isActive && styles.questCardInactive]}>
      {/* Header: Titre + Difficulté */}
      <View style={styles.questHeader}>
        <View style={styles.questTitleRow}>
          {isCompleted && <Text style={styles.completedIcon}>✅ </Text>}
          <Text style={[styles.questTitle, !isActive && styles.questTitleInactive]}>
            {quest.title}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>
            {quest.difficulty === 'EASY' ? '🟢' : 
             quest.difficulty === 'MEDIUM' ? '🟡' : 
             quest.difficulty === 'HARD' ? '🟠' : '🟣'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {quest.description && (
        <Text style={styles.questDescription} numberOfLines={2}>
          {quest.description}
        </Text>
      )}

      {/* Tags: Catégorie + Récompense */}
      <View style={styles.questTags}>
        <Text style={styles.questTag}>{quest.categoryLabel}</Text>
        <Text style={styles.questReward}>+{quest.xpReward} XP</Text>
      </View>

      {/* Actions (seulement si active) */}
      {isActive && (
        <View style={styles.questActions}>
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeButtonText}>✅ Compléter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.abandonButton} onPress={onAbandon}>
            <Text style={styles.abandonButtonText}>🏳️</Text>
          </TouchableOpacity>
        </View>
      )}
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
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBadge: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  statBadgeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  statBadgeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour le FAB
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  
  // Quest Card
  questCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questCardInactive: {
    opacity: 0.6,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  completedIcon: {
    fontSize: 16,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    flex: 1,
  },
  questTitleInactive: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
  },
  questDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  questTags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questTag: {
    fontSize: 12,
    color: colors.textMuted,
  },
  questReward: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
  questActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  abandonButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  abandonButtonText: {
    fontSize: 16,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.textLight,
    marginTop: -2,
  },
});
