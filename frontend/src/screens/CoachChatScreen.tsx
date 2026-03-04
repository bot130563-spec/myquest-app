/**
 * ==========================================
 * 💬 COACH V2 — Écran de Chat
 * ==========================================
 *
 * Chat fluide avec le coach IA.
 * Auto-save, pause automatique, projets inline.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'coach' | 'system';
  content: string;
  createdAt: string;
  // Métadonnées coach
  projectProposal?: ProjectProposal | null;
  wisdomGained?: number;
}

interface ProjectProposal {
  id: string;
  title: string;
  description: string;
  why: string;
  type: string;
  step: string;
}

interface SessionStartResponse {
  sessionId: string;
  message: ChatMessage;
  messages?: ChatMessage[];
}

interface MessageResponse {
  message: ChatMessage;
  wisdomGained: number;
  projectProposal?: ProjectProposal | null;
}

interface ChatProps {
  onBack: () => void;
}

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

export default function CoachChatScreen({ onBack }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [totalWisdom, setTotalWisdom] = useState(0);

  // Animation wisdom gain
  const wisdomAnim = useRef(new Animated.Value(0)).current;
  const [wisdomGainText, setWisdomGainText] = useState('');

  const flatListRef = useRef<FlatList>(null);

  // Démarrer ou reprendre la session au montage
  useEffect(() => {
    startSession();
  }, []);

  // Pause automatique quand on quitte l'écran
  useEffect(() => {
    return () => {
      if (sessionId) {
        api.post(`/coach/session/${sessionId}/pause`).catch((err) =>
          console.error('Erreur pause session:', err)
        );
      }
    };
  }, [sessionId]);

  // Démarrer une session
  const startSession = async () => {
    try {
      const response = await api.post<SessionStartResponse>('/coach/session/start');
      setSessionId(response.sessionId);

      // Charger les messages existants s'il y en a
      const initialMessages: ChatMessage[] = [];
      if (response.messages && response.messages.length > 0) {
        initialMessages.push(...response.messages);
      }
      if (response.message) {
        initialMessages.push(response.message);
      }
      setMessages(initialMessages);
    } catch (err: any) {
      console.error('Erreur démarrage session:', err);
      setMessages([
        {
          id: 'error-start',
          role: 'system',
          content: 'Impossible de démarrer la session. Vérifie ta connexion.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !sessionId || sending) return;

    // Ajouter le message user localement
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const response = await api.post<MessageResponse>(
        `/coach/session/${sessionId}/message`,
        { message: text }
      );

      // Ajouter la réponse du coach
      const coachMsg: ChatMessage = {
        ...response.message,
        projectProposal: response.projectProposal || null,
      };
      setMessages((prev) => [...prev, coachMsg]);

      // Animation wisdom si gain
      if (response.wisdomGained > 0) {
        showWisdomGain(response.wisdomGained);
        setTotalWisdom((prev) => prev + response.wisdomGained);
      }
    } catch (err: any) {
      console.error('Erreur envoi message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Erreur de connexion. Ton message n\'a pas été envoyé.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Animation +wisdom
  const showWisdomGain = (amount: number) => {
    setWisdomGainText(`+${amount} 📚`);
    wisdomAnim.setValue(1);
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(wisdomAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Valider un projet inline
  const handleValidateProject = async (projectId: string) => {
    try {
      await api.post(`/coach/project/${projectId}/validate`);
      // Mettre à jour le message pour indiquer la validation
      setMessages((prev) =>
        prev.map((m) => {
          if (m.projectProposal?.id === projectId) {
            return {
              ...m,
              projectProposal: { ...m.projectProposal, step: 'validated' },
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      console.error('Erreur validation projet:', err);
    }
  };

  // Rejeter un projet inline
  const handleRejectProject = async (projectId: string) => {
    try {
      await api.post(`/coach/project/${projectId}/reject`);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.projectProposal?.id === projectId) {
            return {
              ...m,
              projectProposal: { ...m.projectProposal, step: 'rejected' },
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      console.error('Erreur rejet projet:', err);
    }
  };

  // Rendu d'un message
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      const isSystem = item.role === 'system';

      return (
        <View>
          {/* Bulle de message */}
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : isSystem ? styles.systemBubble : styles.coachBubble,
            ]}
          >
            {!isUser && !isSystem && (
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
                isUser && styles.userMessageText,
                isSystem && styles.systemMessageText,
              ]}
            >
              {item.content}
            </Text>
          </View>

          {/* Card projet inline */}
          {item.projectProposal && item.projectProposal.step !== 'validated' && item.projectProposal.step !== 'rejected' && (
            <View style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectEmoji}>
                  {PROJECT_TYPE_EMOJI[item.projectProposal.type] || '📌'}
                </Text>
                <Text style={styles.projectTitle}>{item.projectProposal.title}</Text>
              </View>
              <Text style={styles.projectDescription}>
                {item.projectProposal.description}
              </Text>
              <Text style={styles.projectWhy}>{item.projectProposal.why}</Text>
              <View style={styles.projectActions}>
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={() => handleValidateProject(item.projectProposal!.id)}
                >
                  <Text style={styles.validateText}>Valider</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectProject(item.projectProposal!.id)}
                >
                  <Text style={styles.rejectText}>Pas maintenant</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Projet validé / rejeté */}
          {item.projectProposal?.step === 'validated' && (
            <View style={[styles.projectCard, styles.projectValidated]}>
              <Text style={styles.projectStatusText}>
                ✅ Projet "{item.projectProposal.title}" validé ! Retrouve-le dans l'onglet Quêtes.
              </Text>
            </View>
          )}
          {item.projectProposal?.step === 'rejected' && (
            <View style={[styles.projectCard, styles.projectRejected]}>
              <Text style={styles.projectStatusText}>
                ⏳ Projet "{item.projectProposal.title}" reporté.
              </Text>
            </View>
          )}
        </View>
      );
    },
    []
  );

  // Écran de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Connexion au coach...</Text>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.coachAvatar}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Coach MyQuest</Text>
              <Text style={styles.headerSubtitle}>Introspection & Projets</Text>
            </View>
          </View>
          {totalWisdom > 0 && (
            <View style={styles.wisdomCounter}>
              <Text style={styles.wisdomText}>📚 {totalWisdom}</Text>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════ */}
        {/* 💬 MESSAGES */}
        {/* ══════════════════════════════════ */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Indicateur typing */}
        {sending && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.typingText}>Le coach réfléchit...</Text>
            </View>
          </View>
        )}

        {/* Animation +wisdom */}
        <Animated.View
          style={[
            styles.wisdomGainPopup,
            {
              opacity: wisdomAnim,
              transform: [
                {
                  translateY: wisdomAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.wisdomGainText}>{wisdomGainText}</Text>
        </Animated.View>

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
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  },
  wisdomCounter: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wisdomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9b59b6',
  },

  // Chat
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    maxWidth: '90%',
  },
  coachIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
    flex: 1,
  },
  userMessageText: {
    color: colors.textLight,
  },
  systemMessageText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Typing
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 8,
  },

  // Wisdom gain popup
  wisdomGainPopup: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  wisdomGainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },

  // Projet inline
  projectCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  projectValidated: {
    borderColor: colors.success,
  },
  projectRejected: {
    borderColor: colors.textMuted,
    opacity: 0.7,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectEmoji: {
    fontSize: 20,
    marginRight: 8,
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
  validateText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  projectStatusText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
    fontSize: 15,
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
