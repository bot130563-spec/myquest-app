/**
 * DashboardScreen.tsx
 * Écran d'accueil RPG - Fiche de personnage
 *
 * Affiche:
 * - Carte de personnage avec avatar, niveau, XP et stats animées
 * - Progression quotidienne des habitudes
 * - Résumé des quêtes actives
 * - Résumé hebdomadaire compact
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import CharacterCard from '../components/CharacterCard';
import DailyProgress from '../components/DailyProgress';

export default function DashboardScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  // Animation de fade in pour l'écran
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Charger les données au montage
  useEffect(() => {
    loadDashboard();
  }, []);

  // Animation fade in après le chargement
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  /**
   * Récupère toutes les données du tableau de bord depuis l'API
   */
  const loadDashboard = async () => {
    try {
      const [dashData, weeklyData, dailyData] = await Promise.all([
        api.get<any>('/dashboard'),
        api.get<any>('/dashboard/weekly-summary'),
        api.get<any>('/dashboard/daily-progress'),
      ]);
      setDashboard(dashData);
      setWeeklySummary(weeklyData);
      setDailyProgress(dailyData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Rafraîchir les données (pull-to-refresh)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  // Affichage de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Si pas de données
  if (!dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Impossible de charger les données</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { avatar, stats, quests, habits } = dashboard;

  // Préparer les données pour CharacterCard
  const characterUser = {
    name: user?.name || avatar?.name || 'Héros',
    level: avatar?.level || 1,
    experience: avatar?.experience || 0,
    xpForNextLevel: avatar?.xpForNextLevel || 100,
    totalXp: stats?.globalScore || 0,
  };

  const characterStats = {
    health: stats?.health || 50,
    energy: stats?.energy || 50,
    wisdom: stats?.wisdom || 50,
    social: stats?.social || 50,
    wealth: stats?.wealth || 50,
  };

  const currentStreak = stats?.currentStreak || 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      {/* Header simple */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Bonjour, {characterUser.name} 👋
        </Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Achievements' as never)}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Carte de personnage RPG */}
      <View style={styles.characterCardContainer}>
        <CharacterCard
          user={characterUser}
          stats={characterStats}
          streak={currentStreak}
        />
      </View>

      {/* Progression quotidienne */}
      {dailyProgress && (
        <View style={styles.sectionContainer}>
          <DailyProgress
            goal={dailyProgress.goal}
            completed={dailyProgress.completed}
            percentage={dailyProgress.percentage}
          />
        </View>
      )}

      {/* Quêtes actives (section compacte) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚔️ Quêtes actives ({quests?.active || 0})</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Quests')}>
              <Text style={styles.seeAllText}>→</Text>
            </TouchableOpacity>
          </View>

          {quests?.upcoming && quests.upcoming.length > 0 ? (
            quests.upcoming.slice(0, 2).map((quest: any) => (
              <View key={quest.id} style={styles.questItem}>
                <Text style={styles.questTitle}>• {quest.title}</Text>
                <Text style={styles.questXp}>+{quest.xpReward} XP</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune quête active</Text>
          )}
        </View>
      </View>

      {/* Résumé hebdomadaire compact */}
      {weeklySummary && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📅 Cette semaine</Text>
            <View style={styles.weeklyCompactGrid}>
              <View style={styles.weeklyCompactItem}>
                <Text style={styles.weeklyCompactValue}>
                  {weeklySummary.questsCompleted}
                </Text>
                <Text style={styles.weeklyCompactLabel}>⚔️ Quêtes</Text>
              </View>
              <View style={styles.weeklyCompactItem}>
                <Text style={styles.weeklyCompactValue}>
                  {weeklySummary.habitCompletions}
                </Text>
                <Text style={styles.weeklyCompactLabel}>🔄 Habitudes</Text>
              </View>
              <View style={styles.weeklyCompactItem}>
                <Text style={styles.weeklyCompactValue}>
                  {weeklySummary.journalEntries}
                </Text>
                <Text style={styles.weeklyCompactLabel}>📓 Entrées</Text>
              </View>
              <View style={styles.weeklyCompactItem}>
                <Text style={styles.weeklyCompactValue}>
                  {weeklySummary.xpEarned}
                </Text>
                <Text style={styles.weeklyCompactLabel}>⭐ XP</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a', // Fond sombre
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#b8b8b8',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4757',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#eaeaea',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  characterCardContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eaeaea',
  },
  seeAllText: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  questItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  questTitle: {
    fontSize: 14,
    color: '#b8b8b8',
    flex: 1,
  },
  questXp: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  weeklyCompactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weeklyCompactItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyCompactValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  weeklyCompactLabel: {
    fontSize: 11,
    color: '#b8b8b8',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
