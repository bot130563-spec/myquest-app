/**
 * DashboardScreen.tsx
 * Tableau de bord principal - vue d'ensemble de la progression
 * 
 * Affiche:
 * - Niveau et XP avec barre de progression
 * - Statistiques du personnage (santé, énergie, sagesse, social, richesse)
 * - Résumé des quêtes actives
 * - Streaks d'habitudes
 * - Humeur récente (journal)
 * - Conseils personnalisés
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
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';

// Icônes pour les statistiques
const STAT_CONFIG = {
  health: { icon: '❤️', label: 'Santé', color: '#e74c3c' },
  energy: { icon: '⚡', label: 'Énergie', color: '#f39c12' },
  wisdom: { icon: '📚', label: 'Sagesse', color: '#3498db' },
  social: { icon: '👥', label: 'Social', color: '#9b59b6' },
  wealth: { icon: '💰', label: 'Richesse', color: '#27ae60' },
};

// Emojis humeur pour l'affichage
const MOOD_EMOJIS = ['', '😢', '😕', '😐', '🙂', '😄'];

export default function DashboardScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  // Charger les données au montage
  useEffect(() => {
    loadDashboard();
  }, []);

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

  const { user: userData, quests, habits, journal, tips } = dashboard;
  const xpProgress = userData.xpToNextLevel > 0 
    ? (userData.xpProgress / userData.xpToNextLevel) * 100 
    : 100;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* En-tête avec niveau et XP */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>{userData.avatar?.emoji || '🧙'}</Text>
        </View>
        {/* Bouton Achievements */}
        <TouchableOpacity
          style={styles.achievementsButton}
          onPress={() => navigation.navigate('Achievements' as never)}
        >
          <Text style={styles.achievementsButtonText}>🏆</Text>
        </TouchableOpacity>
        {/* Bouton Leaderboard */}
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => navigation.navigate('Leaderboard' as never)}
        >
          <Text style={styles.leaderboardButtonText}>🥇</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.welcomeText}>
            Bienvenue, {userData.username} !
          </Text>
          <Text style={styles.levelText}>Niveau {userData.level}</Text>
          
          {/* Barre de progression XP */}
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {userData.xpProgress} / {userData.xpToNextLevel} XP
          </Text>
        </View>
      </View>

      {/* Statistiques du personnage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statistiques</Text>
        <View style={styles.statsGrid}>
          {Object.entries(STAT_CONFIG).map(([key, config]) => (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statIcon}>{config.icon}</Text>
              <Text style={styles.statLabel}>{config.label}</Text>
              <Text style={[styles.statValue, { color: config.color }]}>
                {userData.stats?.[key] || 0}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progression du jour (Daily Progress Bar) */}
      {dailyProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Progression du jour</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${dailyProgress.percentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {dailyProgress.message}
            </Text>
          </View>
        </View>
      )}

      {/* Résumé hebdomadaire (Weekly Summary) */}
      {weeklySummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Résumé de la semaine</Text>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyIcon}>⚔️</Text>
              <Text style={styles.weeklyValue}>{weeklySummary.questsCompleted}</Text>
              <Text style={styles.weeklyLabel}>Quêtes</Text>
            </View>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyIcon}>🔥</Text>
              <Text style={styles.weeklyValue}>{weeklySummary.habitsAverageStreak}</Text>
              <Text style={styles.weeklyLabel}>Streak moy.</Text>
            </View>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyIcon}>📓</Text>
              <Text style={styles.weeklyValue}>{weeklySummary.journalEntries}</Text>
              <Text style={styles.weeklyLabel}>Entrées</Text>
            </View>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyIcon}>⭐</Text>
              <Text style={styles.weeklyValue}>{weeklySummary.xpEarned}</Text>
              <Text style={styles.weeklyLabel}>XP gagné</Text>
            </View>
          </View>
        </View>
      )}

      {/* Résumé des quêtes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚔️ Quêtes</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Quests')}>
            <Text style={styles.seeAllText}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.questsRow}>
          <View style={styles.questStat}>
            <Text style={styles.questStatNumber}>{quests.active}</Text>
            <Text style={styles.questStatLabel}>En cours</Text>
          </View>
          <View style={styles.questStatDivider} />
          <View style={styles.questStat}>
            <Text style={styles.questStatNumber}>{quests.completed}</Text>
            <Text style={styles.questStatLabel}>Terminées</Text>
          </View>
          <View style={styles.questStatDivider} />
          <View style={styles.questStat}>
            <Text style={[styles.questStatNumber, { color: '#f39c12' }]}>
              {quests.dueSoon}
            </Text>
            <Text style={styles.questStatLabel}>Bientôt dues</Text>
          </View>
        </View>
      </View>

      {/* Résumé des habitudes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔄 Habitudes</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Habits')}>
            <Text style={styles.seeAllText}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.habitsRow}>
          <View style={styles.habitStat}>
            <Text style={styles.habitStatNumber}>
              {habits.completedToday}/{habits.total}
            </Text>
            <Text style={styles.habitStatLabel}>Aujourd'hui</Text>
          </View>
          
          {habits.bestStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>
                Meilleur streak: {habits.bestStreak} jours
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Humeur du journal */}
      {journal.todayMood && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📓 Journal</Text>
          <View style={styles.moodCard}>
            <Text style={styles.moodEmoji}>
              {MOOD_EMOJIS[journal.todayMood]}
            </Text>
            <Text style={styles.moodLabel}>Humeur d'aujourd'hui</Text>
          </View>
          {journal.weeklyAverage && (
            <Text style={styles.weeklyMood}>
              📈 Moyenne de la semaine : {journal.weeklyAverage.toFixed(1)}/5
            </Text>
          )}
        </View>
      )}

      {/* Conseils personnalisés */}
      {tips && tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Conseils</Text>
          {tips.map((tip: string, index: number) => (
            <View key={index} style={styles.tipCard}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Boutons d'action rapide */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: '#6c5ce7' }]}
          onPress={() => navigation?.navigate('CreateQuest')}
        >
          <Text style={styles.quickActionIcon}>⚔️</Text>
          <Text style={styles.quickActionText}>Nouvelle quête</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: '#00b894' }]}
          onPress={() => navigation?.navigate('CreateHabit')}
        >
          <Text style={styles.quickActionIcon}>🔄</Text>
          <Text style={styles.quickActionText}>Nouvelle habitude</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#6c5ce7',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  achievementsButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsButtonText: {
    fontSize: 24,
  },
  leaderboardButton: {
    position: 'absolute',
    top: 45,
    right: 75,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardButtonText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#00b894',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6c5ce7',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 10,
    color: '#636e72',
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  questsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  questStat: {
    alignItems: 'center',
    flex: 1,
  },
  questStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6c5ce7',
  },
  questStatLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  questStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  habitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b894',
  },
  habitStatLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  streakText: {
    fontSize: 13,
    color: '#e65100',
    fontWeight: '500',
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  moodEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  moodLabel: {
    fontSize: 16,
    color: '#2d3436',
  },
  weeklyMood: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 12,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00b894',
    borderRadius: 6,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#2d3436',
    textAlign: 'center',
    fontWeight: '500',
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  weeklyItem: {
    alignItems: 'center',
  },
  weeklyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  weeklyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c5ce7',
  },
  weeklyLabel: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 2,
  },
});
