/**
 * ==========================================
 * 🧭 COACH V2 — Écran d'Onboarding
 * ==========================================
 *
 * 6 questions d'introspection, une par écran.
 * Progress bar, navigation fluide, transition vers le chat.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

interface OnboardingQuestion {
  zone: string;
  question: string;
}

interface OnboardingProps {
  onComplete: () => void;
}

// ============================================
// 📋 QUESTIONS D'ONBOARDING
// ============================================

const QUESTIONS: OnboardingQuestion[] = [
  { zone: 'values', question: 'Pense à un moment récent où tu t\'es senti vraiment vivant. Que faisais-tu ?' },
  { zone: 'values', question: 'Qu\'est-ce qui te met en colère quand tu le vois dans le monde ?' },
  { zone: 'strengths', question: 'Dans quoi les gens viennent-ils te demander de l\'aide ?' },
  { zone: 'shadows', question: 'Quel trait de caractère tu sais que tu devrais changer, mais que tu repousses ?' },
  { zone: 'chaosOrder', question: 'Face à l\'inconnu, ta première réaction : fuir, réfléchir, ou foncer ?' },
  { zone: 'vision', question: 'Imagine-toi dans 5 ans, ta meilleure version. Décris cette scène.' },
];

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CoachOnboardingScreen({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(QUESTIONS.length).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation de transition entre questions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / QUESTIONS.length;
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;
  const canProceed = answers[currentIndex].trim().length > 10;

  // Transition animée vers la question suivante ou précédente
  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    const slideOut = direction === 'next' ? -30 : 30;
    const slideIn = direction === 'next' ? 30 : -30;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: slideOut, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(slideIn);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  // Passer à la question suivante
  const handleNext = () => {
    if (!canProceed) return;

    if (isLastQuestion) {
      handleSubmit();
    } else {
      animateTransition('next', () => setCurrentIndex((i) => i + 1));
    }
  };

  // Revenir à la question précédente
  const handleBack = () => {
    if (currentIndex === 0) return;
    animateTransition('prev', () => setCurrentIndex((i) => i - 1));
  };

  // Mettre à jour la réponse courante
  const handleAnswerChange = (text: string) => {
    const updated = [...answers];
    updated[currentIndex] = text;
    setAnswers(updated);
    setError(null);
  };

  // Soumettre toutes les réponses
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = QUESTIONS.map((q, i) => ({
        question: q.question,
        answer: answers[i],
        zone: q.zone,
      }));

      await api.post('/coach/onboarding', { answers: payload });
      onComplete();
    } catch (err: any) {
      console.error('Erreur onboarding:', err);
      setError(err.message || 'Une erreur est survenue. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  // Indicateur de zone pour chaque question
  const getZoneLabel = (zone: string): string => {
    const labels: Record<string, string> = {
      values: 'Tes valeurs',
      strengths: 'Tes forces',
      shadows: 'Ton ombre',
      chaosOrder: 'Chaos & Ordre',
      vision: 'Ta vision',
    };
    return labels[zone] || zone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* ══════════════════════════════════ */}
        {/* 📊 PROGRESS BAR */}
        {/* ══════════════════════════════════ */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {QUESTIONS.length}
          </Text>
        </View>

        {/* ══════════════════════════════════ */}
        {/* ❓ QUESTION */}
        {/* ══════════════════════════════════ */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.questionContainer,
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Text style={styles.zoneLabel}>{getZoneLabel(currentQuestion.zone)}</Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            <TextInput
              style={styles.answerInput}
              placeholder="Prends le temps de répondre honnêtement..."
              placeholderTextColor={colors.textMuted}
              value={answers[currentIndex]}
              onChangeText={handleAnswerChange}
              multiline
              textAlignVertical="top"
              editable={!submitting}
              autoFocus
            />

            {!canProceed && answers[currentIndex].length > 0 && (
              <Text style={styles.hintText}>Développe un peu plus ta réponse...</Text>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </Animated.View>
        </ScrollView>

        {/* ══════════════════════════════════ */}
        {/* 🔘 BOUTONS NAVIGATION */}
        {/* ══════════════════════════════════ */}
        <View style={styles.buttonsContainer}>
          {currentIndex > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={submitting}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? 'Terminer' : 'Suivant'}
                </Text>
                {!isLastQuestion && (
                  <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
                )}
              </>
            )}
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

  // Progress bar
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Zone de scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  // Question
  questionContainer: {
    flex: 1,
  },
  zoneLabel: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textLight,
    lineHeight: 32,
    marginBottom: 32,
  },
  answerInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 12,
  },

  // Boutons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
