/**
 * ==========================================
 * 🔄 ÉCRAN HABITUDES DU JOUR
 * ==========================================
 * 
 * Affiche les habitudes à faire aujourd'hui.
 * Permet de les marquer comme complétées.
 */

import React, { useState, useCallback } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api, ApiError } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface Habit {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  categoryLabel: string;
  frequency: string;
  frequencyLabel: string;
  xpReward: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isCompletedToday: boolean;
}

interface TodayResponse {
  date: string;
  dayName: string;
  habits: Habit[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface CompleteResponse {
  message: string;
  rewards: { xp: number };
  streak: number;
  levelUp: boolean;
  newLevel: number;
}

type HabitsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function HabitsScreen({ navigation }: HabitsScreenProps) {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  async function loadHabits(): Promise<void> {
    try {
      const response = await api.get<TodayResponse>('/habits/today');
      setData(response);
    } catch (error) {
      console.error('Load habits error:', error);
      Alert.alert('Erreur', 'Impossible de charger les habitudes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh(): void {
    setIsRefreshing(true);
    loadHabits();
  }

  async function handleComplete(habit: Habit): Promise<void> {
    try {
      const response = await api.post<CompleteResponse>(`/habits/${habit.id}/complete`);
      
      if (response.levelUp) {
        Alert.alert('🎉 LEVEL UP!', response.message);
      } else {
        Alert.alert('✅ Bravo!', response.message);
      }
      
      loadHabits();
      
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Erreur';
      Alert.alert('Info', msg);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const progress = data?.progress || { completed: 0, total: 0, percentage: 0 };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ═══════════════════════════════════════ */}
      {/* 📊 HEADER - Progression du jour */}
      {/* ═══════════════════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar" size={18} color={colors.textLight} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{data?.dayName}</Text>
          </View>
          <Text style={styles.progressText}>
            {progress.completed}/{progress.total}
          </Text>
        </View>
        
        {/* Barre de progression */}
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress.percentage}%` }
            ]} 
          />
        </View>

        {progress.percentage === 100 && progress.total > 0 && (
          <Text style={styles.completeText}>Toutes les habitudes du jour sont faites!</Text>
        )}
      </View>

      {/* ═══════════════════════════════════════ */}
      {/* 📋 LISTE DES HABITUDES */}
      {/* ═══════════════════════════════════════ */}
      <FlatList
        data={data?.habits || []}
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
            <Ionicons name="repeat" size={64} color={colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>Pas d'habitudes pour aujourd'hui</Text>
            <Text style={styles.emptySubtext}>Crée ta première habitude!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onComplete={() => handleComplete(item)}
          />
        )}
      />

      {/* ═══════════════════════════════════════ */}
      {/* ➕ BOUTON CRÉER */}
      {/* ═══════════════════════════════════════ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateHabit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ============================================
// 📦 COMPOSANT HABIT CARD
// ============================================

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
}

function HabitCard({ habit, onComplete }: HabitCardProps) {
  const isCompleted = habit.isCompletedToday;

  return (
    <View style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}>
      <View style={styles.habitContent}>
        {/* Icon + Title */}
        <View style={styles.habitMain}>
          <Text style={styles.habitIcon}>{habit.icon}</Text>
          <View style={styles.habitInfo}>
            <Text style={[
              styles.habitTitle,
              isCompleted && styles.habitTitleCompleted
            ]}>
              {habit.title}
            </Text>
            <View style={styles.habitMeta}>
              <Text style={styles.habitCategory}>{habit.categoryLabel}</Text>
              {habit.currentStreak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="fire" size={12} color={colors.warning} style={{ marginRight: 2 }} />
                  <Text style={styles.habitStreak}>{habit.currentStreak} j</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* XP Reward */}
        <Text style={styles.habitXp}>+{habit.xpReward} XP</Text>
      </View>

      {/* Action Button */}
      {!isCompleted ? (
        <TouchableOpacity style={styles.checkButton} onPress={onComplete}>
          <Ionicons name="checkmark-circle" size={20} color={colors.textLight} style={{ marginRight: 6 }} />
          <Text style={styles.checkButtonText}>Fait!</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneIndicator}>
          <Ionicons name="checkmark-done-circle" size={20} color={colors.success} style={{ marginRight: 6 }} />
          <Text style={styles.doneText}>Complété</Text>
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
  
  // Header
  header: {
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  completeText: {
    textAlign: 'center',
    color: colors.success,
    marginTop: 12,
    fontWeight: '600',
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
  emptyText: {
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  
  // Habit Card
  habitCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  habitCardCompleted: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  habitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  habitMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  habitCategory: {
    fontSize: 12,
    color: colors.textMuted,
  },
  habitStreak: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  habitXp: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
  
  // Buttons
  checkButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 16,
  },
  doneIndicator: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: colors.success,
    fontWeight: '600',
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
