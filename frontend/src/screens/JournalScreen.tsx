/**
 * ==========================================
 * 📓 ÉCRAN JOURNAL - Écriture du jour
 * ==========================================
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api, ApiError } from '../config/api';

// ============================================
// 📦 TYPES & CONSTANTES
// ============================================

const MOODS = [
  { value: 1, emoji: '😢', label: 'Très difficile' },
  { value: 2, emoji: '😔', label: 'Difficile' },
  { value: 3, emoji: '😐', label: 'Neutre' },
  { value: 4, emoji: '🙂', label: 'Bon' },
  { value: 5, emoji: '😄', label: 'Excellent' },
];

interface JournalEntry {
  id: string;
  mood: number;
  content: string | null;
  gratitudes: string[];
  dailyGoal: string | null;
  reflection: string | null;
}

interface TodayResponse {
  exists: boolean;
  date: string;
  entry: JournalEntry | null;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function JournalScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  
  // Données du formulaire
  const [mood, setMood] = useState(3);
  const [content, setContent] = useState('');
  const [gratitudes, setGratitudes] = useState<string[]>(['', '', '']);
  const [dailyGoal, setDailyGoal] = useState('');
  const [reflection, setReflection] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTodayEntry();
    }, [])
  );

  async function loadTodayEntry(): Promise<void> {
    try {
      const response = await api.get<TodayResponse>('/journal/today');
      
      if (response.exists && response.entry) {
        const e = response.entry;
        setHasExisting(true);
        setMood(e.mood);
        setContent(e.content || '');
        setGratitudes(e.gratitudes.length > 0 ? [...e.gratitudes, '', ''].slice(0, 3) : ['', '', '']);
        setDailyGoal(e.dailyGoal || '');
        setReflection(e.reflection || '');
      }
    } catch (error) {
      console.error('Load journal error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function updateGratitude(index: number, value: string): void {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = value;
    setGratitudes(newGratitudes);
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);

    try {
      const filteredGratitudes = gratitudes.filter(g => g.trim() !== '');
      
      await api.post('/journal', {
        mood,
        content: content.trim() || null,
        gratitudes: filteredGratitudes,
        dailyGoal: dailyGoal.trim() || null,
        reflection: reflection.trim() || null,
      });

      const message = hasExisting 
        ? 'Journal mis à jour! 📝' 
        : 'Journal enregistré! +15 XP 📓';
      
      Alert.alert('✅ Enregistré', message);
      setHasExisting(true);
      
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Erreur';
      Alert.alert('Erreur', msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ═══════════════════════════════════════ */}
        {/* 😊 HUMEUR */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment te sens-tu?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.moodButton,
                  mood === m.value && styles.moodButtonSelected,
                ]}
                onPress={() => setMood(m.value)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.moodLabel}>
            {MOODS.find(m => m.value === mood)?.label}
          </Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📝 CONTENU LIBRE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Qu'as-tu en tête?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Écris ce que tu veux..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🙏 GRATITUDES */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🙏 3 gratitudes du jour</Text>
          {gratitudes.map((g, i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={`Gratitude ${i + 1}...`}
              placeholderTextColor={colors.textMuted}
              value={g}
              onChangeText={(v) => updateGratitude(i, v)}
            />
          ))}
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🎯 OBJECTIF */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Objectif du jour</Text>
          <TextInput
            style={styles.input}
            placeholder="Sur quoi veux-tu te concentrer?"
            placeholderTextColor={colors.textMuted}
            value={dailyGoal}
            onChangeText={setDailyGoal}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 💡 RÉFLEXION */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Leçon ou réflexion</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Qu'as-tu appris aujourd'hui?"
            placeholderTextColor={colors.textMuted}
            value={reflection}
            onChangeText={setReflection}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 💾 BOUTON SAUVEGARDER */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasExisting ? '💾 Mettre à jour' : '📓 Enregistrer (+15 XP)'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        {!hasExisting && (
          <Text style={styles.infoText}>
            Écrire dans ton journal te donne 15 XP et +1 Sagesse 📚
          </Text>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  
  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  moodButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
  },
  
  // Inputs
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Save Button
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Info
  infoText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
