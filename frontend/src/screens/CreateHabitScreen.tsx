/**
 * ==========================================
 * ➕ ÉCRAN CRÉATION D'HABITUDE
 * ==========================================
 */

import React, { useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { api, ApiError } from '../config/api';

// ============================================
// 📦 CONSTANTES
// ============================================

type CreateHabitScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const ICONS = ['⭐', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '💰', '👥', '✍️', '🎯'];

const CATEGORIES = [
  { value: 'HEALTH', label: '💪 Santé' },
  { value: 'ENERGY', label: '⚡ Énergie' },
  { value: 'WISDOM', label: '📚 Sagesse' },
  { value: 'SOCIAL', label: '👥 Social' },
  { value: 'WEALTH', label: '💰 Finances' },
  { value: 'GENERAL', label: '⭐ Général' },
];

const FREQUENCIES = [
  { value: 'DAILY', label: '📅 Tous les jours' },
  { value: 'WEEKDAYS', label: '💼 Semaine (Lun-Ven)' },
  { value: 'WEEKENDS', label: '🌴 Week-end' },
  { value: 'WEEKLY', label: '📆 Certains jours' },
];

const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CreateHabitScreen({ navigation }: CreateHabitScreenProps) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [category, setCategory] = useState('GENERAL');
  const [frequency, setFrequency] = useState('DAILY');
  const [targetDays, setTargetDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDay(day: number): void {
    if (targetDays.includes(day)) {
      setTargetDays(targetDays.filter(d => d !== day));
    } else {
      setTargetDays([...targetDays, day]);
    }
  }

  async function handleCreate(): Promise<void> {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    if (frequency === 'WEEKLY' && targetDays.length === 0) {
      Alert.alert('Erreur', 'Sélectionne au moins un jour');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/habits', {
        title: title.trim(),
        icon,
        category,
        frequency,
        targetDays: frequency === 'WEEKLY' ? targetDays : [],
      });

      Alert.alert(
        '🔄 Habitude créée!',
        'La constance est la clé du succès!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Erreur';
      Alert.alert('Erreur', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ═══════════════════════════════════════ */}
        {/* 🎨 ICÔNE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>🎨 Icône</Text>
          <View style={styles.iconsGrid}>
            {ICONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.iconButton,
                  icon === emoji && styles.iconButtonSelected,
                ]}
                onPress={() => setIcon(emoji)}
              >
                <Text style={styles.iconEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📝 TITRE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{icon} Nom de l'habitude *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Méditer 10 minutes"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🏷️ CATÉGORIE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>🏷️ Catégorie</Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.optionButton,
                  category === cat.value && styles.optionButtonSelected,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={[
                  styles.optionText,
                  category === cat.value && styles.optionTextSelected,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📅 FRÉQUENCE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>📅 Fréquence</Text>
          <View style={styles.frequencyOptions}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyButton,
                  frequency === freq.value && styles.frequencyButtonSelected,
                ]}
                onPress={() => setFrequency(freq.value)}
              >
                <Text style={[
                  styles.frequencyText,
                  frequency === freq.value && styles.frequencyTextSelected,
                ]}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📆 JOURS (si WEEKLY) */}
        {/* ═══════════════════════════════════════ */}
        {frequency === 'WEEKLY' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📆 Quels jours?</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    targetDays.includes(day.value) && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(day.value)}
                >
                  <Text style={[
                    styles.dayText,
                    targetDays.includes(day.value) && styles.dayTextSelected,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* 🎁 INFO RÉCOMPENSE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎁 Récompenses par complétion</Text>
          <Text style={styles.infoText}>+10 XP et +1 stat à chaque fois!</Text>
          <Text style={styles.infoSubtext}>
            Les habitudes rapportent moins que les quêtes, mais la régularité paie!
          </Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🚀 BOUTON CRÉER */}
        {/* ═══════════════════════════════════════ */}
        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.createButtonText}>🔄 Créer l'habitude</Text>
          )}
        </TouchableOpacity>
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
    padding: 20,
  },
  
  // Inputs
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Icons Grid
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  iconButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  iconEmoji: {
    fontSize: 24,
  },
  
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  optionButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  
  // Frequency Options
  frequencyOptions: {
    gap: 8,
  },
  frequencyButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
  frequencyButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  frequencyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  frequencyTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  
  // Days Row
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  dayButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.textLight,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gold,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Create Button
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
});
