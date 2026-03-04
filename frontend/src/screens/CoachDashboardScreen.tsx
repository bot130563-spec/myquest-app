/**
 * ==========================================
 * 📊 COACH V2 — Dashboard du Coaching
 * ==========================================
 *
 * Vue d'ensemble : portrait, barres de clarté,
 * insights, projets proposés, stat Wisdom.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface ClarityZone {
  zone: string;
  clarity: number;
  label: string;
}

interface Insight {
  text: string;
  zone: string;
}

interface ProjectProposal {
  id: string;
  title: string;
  description: string;
  why: string;
  type: string;
  status: string;
}

interface CoachDashboardData {
  profile: {
    summary: string;
    onboardingDone: boolean;
    currentPhase: number;
  };
  clarityZones: ClarityZone[];
  insights: Insight[];
  projects: ProjectProposal[];
  wisdom: number;
  lastSession?: {
    id: string;
    status: string;
  };
}

interface DashboardProps {
  onStartChat: () => void;
}

// ============================================
// 🏷️ LABELS ET ÉMOJIS DES ZONES
// ============================================

const ZONE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  values: { label: 'Valeurs', emoji: '💎', color: '#e94560' },
  strengths: { label: 'Forces', emoji: '⚡', color: '#00d9a6' },
  shadows: { label: 'Ombre', emoji: '🌑', color: '#9b59b6' },
  chaosOrder: { label: 'Chaos/Ordre', emoji: '🔥', color: '#f39c12' },
  vision: { label: 'Vision', emoji: '🔮', color: '#3498db' },
};

// Émojis pour les types de projet
const PROJECT_TYPE_EMOJI: Record<string, string> = {
  remediation: '🩹',
  amplification: '🚀',
  alignment: '🧭',
  confrontation: '🐉',
  vision: '🌉',
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CoachDashboardScreen({ onStartChat }: DashboardProps) {
  const [data, setData] = useState<CoachDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Charger les données du dashboard coach
  const loadDashboard = async () => {
    try {
      const response = await api.get<CoachDashboardData>('/coach/dashboard');
      setData(response);
    } catch (err: any) {
      console.error('Erreur chargement coach dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  // Valider un projet proposé
  const handleValidateProject = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      await api.post(`/coach/project/${projectId}/validate`);
      loadDashboard();
    } catch (err: any) {
      console.error('Erreur validation projet:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Rejeter un projet proposé
  const handleRejectProject = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      await api.post(`/coach/project/${projectId}/reject`);
      loadDashboard();
    } catch (err: any) {
      console.error('Erreur rejet projet:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Écran de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement du coaching...</Text>
      </View>
    );
  }

  // Fallback si pas de données
  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Impossible de charger le dashboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════ */}
        {/* 🧠 HEADER */}
        {/* ══════════════════════════════════ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Ton Coaching</Text>
            <Text style={styles.headerSubtitle}>Phase {data.profile.currentPhase}</Text>
          </View>
          <View style={styles.wisdomBadge}>
            <Text style={styles.wisdomEmoji}>📚</Text>
            <Text style={styles.wisdomValue}>{data.wisdom}</Text>
          </View>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 📝 PORTRAIT SYNTHÉTIQUE */}
        {/* ══════════════════════════════════ */}
        {data.profile.summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ton portrait</Text>
            <Text style={styles.summaryText}>{data.profile.summary}</Text>
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 📊 BARRES DE CLARTÉ */}
        {/* ══════════════════════════════════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clarté du profil</Text>
          {(data.clarityZones || []).map((zone) => {
            const config = ZONE_CONFIG[zone.zone] || {
              label: zone.zone,
              emoji: '❓',
              color: colors.textMuted,
            };
            const percent = Math.round(zone.clarity * 100);

            return (
              <View key={zone.zone} style={styles.clarityRow}>
                <View style={styles.clarityHeader}>
                  <Text style={styles.clarityLabel}>
                    {config.emoji} {config.label}
                  </Text>
                  <Text style={[styles.clarityPercent, { color: config.color }]}>
                    {percent}%
                  </Text>
                </View>
                <View style={styles.clarityBarBg}>
                  <View
                    style={[
                      styles.clarityBarFill,
                      { width: `${percent}%`, backgroundColor: config.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ══════════════════════════════════ */}
        {/* 💡 INSIGHTS CLÉS */}
        {/* ══════════════════════════════════ */}
        {data.insights && data.insights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Insights clés</Text>
            {data.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={styles.insightBullet}>•</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 📋 PROJETS PROPOSÉS */}
        {/* ══════════════════════════════════ */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Projets proposés</Text>
            {data.projects
              .filter((p) => p.status === 'proposed' || p.status === 'discussing')
              .map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTypeEmoji}>
                      {PROJECT_TYPE_EMOJI[project.type] || '📌'}
                    </Text>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                  </View>
                  <Text style={styles.projectDescription}>{project.description}</Text>
                  <Text style={styles.projectWhy}>{project.why}</Text>

                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      style={styles.validateButton}
                      onPress={() => handleValidateProject(project.id)}
                      disabled={actionLoading === project.id}
                    >
                      {actionLoading === project.id ? (
                        <ActivityIndicator size="small" color={colors.textLight} />
                      ) : (
                        <Text style={styles.validateButtonText}>Valider</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectProject(project.id)}
                      disabled={actionLoading === project.id}
                    >
                      <Text style={styles.rejectButtonText}>Pas maintenant</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* ▶️ BOUTON CONTINUER */}
        {/* ══════════════════════════════════ */}
        <TouchableOpacity style={styles.continueButton} onPress={onStartChat}>
          <Ionicons name="chatbubbles" size={22} color={colors.textLight} />
          <Text style={styles.continueButtonText}>Continuer la session</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.textLight,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  wisdomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  wisdomEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  wisdomValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9b59b6',
  },

  // Cards
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 16,
  },

  // Portrait
  summaryText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Barres de clarté
  clarityRow: {
    marginBottom: 14,
  },
  clarityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clarityLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clarityPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clarityBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  clarityBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Insights
  insightRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  insightBullet: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 8,
    lineHeight: 22,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Projets
  projectCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTypeEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  projectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  projectWhy: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 10,
  },
  validateButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  validateButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },

  // Bouton continuer
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
});
