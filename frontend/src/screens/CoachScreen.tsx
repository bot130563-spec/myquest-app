/**
 * ==========================================
 * 🧠 COACH IA EXPERT — Interface Chat
 * ==========================================
 *
 * Coach basé sur:
 * - Atomic Habits (James Clear)
 * - Introspection structurée
 * - Ikigai & Vision
 * - Les 4 Phases du coaching
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

interface Phase {
  id: string;
  title: string;
  icon: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked';
  progress: number;
}

interface HabitAnalysis {
  habitId: string;
  title: string;
  score: number;
  streak: number;
  completionRate: number;
  status: 'strong' | 'developing' | 'needs_work';
  recommendation: string;
  atomicLaw: string;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState('phase1');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [habitAnalysis, setHabitAnalysis] = useState<HabitAnalysis[]>([]);
  const [showPhases, setShowPhases] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Charger les phases au montage
  useEffect(() => {
    loadPhases();
    loadHabitAnalysis();
    // Message d'accueil
    addCoachMessage(
      "Bonjour! 👋 Je suis ton coach personnel. Comment tu arrives dans cette session aujourd'hui?"
    );
  }, []);

  const loadPhases = async () => {
    try {
      const response = await api.get<{ phases: Phase[] }>('/coach/phases');
      setPhases(response.phases);
    } catch (error) {
      console.error('Error loading phases:', error);
    }
  };

  const loadHabitAnalysis = async () => {
    try {
      const response = await api.post<{ analysis: HabitAnalysis[] }>('/coach/habit-analysis');
      setHabitAnalysis(response.analysis);
    } catch (error) {
      console.error('Error loading habit analysis:', error);
    }
  };

  const addCoachMessage = (content: string) => {
    const newMessage: Message = {
      id: `coach-${Date.now()}`,
      role: 'coach',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post<{
        reply: string;
        sessionId: string;
        phase: string;
        suggestedActions?: string[];
      }>('/coach/message', {
        message: inputText,
        sessionId,
      });

      setSessionId(response.sessionId);
      setCurrentPhase(response.phase);
      addCoachMessage(response.reply);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Send message error:', error);
      addCoachMessage(
        "Désolé, j'ai eu un problème de connexion. Peux-tu reformuler?"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      brain: 'brain',
      target: 'target',
      repeat: 'repeat',
      flash: 'flash',
    };
    return iconMap[iconName] || 'help-circle';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ══════════════════════════════════ */}
        {/* 📋 HEADER */}
        {/* ══════════════════════════════════ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coachAvatar}>
              <Ionicons name="sparkles" size={24} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Ton Coach Personnel</Text>
              <Text style={styles.headerSubtitle}>
                Phase {currentPhase.slice(-1)} • Expert en développement
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowPhases(!showPhases)}>
            <Ionicons
              name="list"
              size={24}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 📊 PHASES (accordéon) */}
        {/* ══════════════════════════════════ */}
        {showPhases && (
          <View style={styles.phasesContainer}>
            <Text style={styles.phasesTitle}>Les 4 Phases du Coaching</Text>
            {phases.map((phase) => (
              <View key={phase.id} style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <MaterialCommunityIcons
                    name={getPhaseIcon(phase.icon) as any}
                    size={24}
                    color={
                      phase.status === 'locked'
                        ? colors.textMuted
                        : colors.accent
                    }
                  />
                  <View style={styles.phaseInfo}>
                    <Text
                      style={[
                        styles.phaseTitle,
                        phase.status === 'locked' && styles.phaseLocked,
                      ]}
                    >
                      {phase.title}
                    </Text>
                    <Text style={styles.phaseDescription}>
                      {phase.description}
                    </Text>
                  </View>
                  {phase.status === 'completed' && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.success}
                    />
                  )}
                </View>
                {phase.status !== 'locked' && (
                  <View style={styles.phaseProgress}>
                    <View
                      style={[
                        styles.phaseProgressBar,
                        { width: `${phase.progress}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 📊 ANALYSE HABITUDES */}
        {/* ══════════════════════════════════ */}
        {habitAnalysis.length > 0 && (
          <View style={styles.analysisSection}>
            <TouchableOpacity
              style={styles.analysisTrigger}
              onPress={() => setShowAnalysis(!showAnalysis)}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.analysisTriggerText}>
                Analyse Atomic Habits ({habitAnalysis.length})
              </Text>
              <Ionicons
                name={showAnalysis ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showAnalysis && (
              <View style={styles.analysisContent}>
                {habitAnalysis.map((habit) => (
                  <View key={habit.habitId} style={styles.habitAnalysisCard}>
                    <View style={styles.habitAnalysisHeader}>
                      <Text style={styles.habitAnalysisTitle}>
                        {habit.title}
                      </Text>
                      <View
                        style={[
                          styles.habitStatusBadge,
                          {
                            backgroundColor:
                              habit.status === 'strong'
                                ? colors.success + '30'
                                : habit.status === 'developing'
                                ? colors.warning + '30'
                                : colors.accent + '30',
                          },
                        ]}
                      >
                        <Text style={styles.habitStatusText}>
                          Score: {habit.score}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.habitRecommendation}>
                      💡 {habit.recommendation}
                    </Text>
                    <Text style={styles.habitAtomicLaw}>
                      📚 {habit.atomicLaw}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════ */}
        {/* 💬 CHAT */}
        {/* ══════════════════════════════════ */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user'
                  ? styles.userBubble
                  : styles.coachBubble,
              ]}
            >
              {message.role === 'coach' && (
                <Ionicons
                  name="sparkles"
                  size={16}
                  color="#FFD700"
                  style={styles.coachIcon}
                />
              )}
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' && styles.userMessageText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Le coach réfléchit...</Text>
            </View>
          )}
        </ScrollView>

        {/* ══════════════════════════════════ */}
        {/* ⌨️ INPUT */}
        {/* ══════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écris ton message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.textLight : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Phases
  phasesContainer: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  phasesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  phaseCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  phaseLocked: {
    color: colors.textMuted,
  },
  phaseDescription: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  phaseProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  phaseProgressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  // Analysis
  analysisSection: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  analysisTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  analysisTriggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginLeft: 8,
  },
  analysisContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  habitAnalysisCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  habitAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    flex: 1,
  },
  habitStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  habitStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  habitRecommendation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  habitAtomicLaw: {
    fontSize: 11,
    color: colors.accent,
    fontStyle: 'italic',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    flex: 1,
  },
  userMessageText: {
    color: colors.textLight,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 14,
    color: colors.textLight,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
