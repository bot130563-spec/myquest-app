/**
 * ==========================================
 * ➕ ÉCRAN CRÉATION DE QUÊTE
 * ==========================================
 * 
 * Formulaire pour créer une nouvelle quête.
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
// 📦 TYPES & CONSTANTES
// ============================================

type CreateQuestScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const CATEGORIES = [
  { value: 'HEALTH', label: '💪 Santé', color: colors.healthBar },
  { value: 'ENERGY', label: '⚡ Énergie', color: colors.energyBar },
  { value: 'WISDOM', label: '📚 Sagesse', color: colors.wisdomBar },
  { value: 'SOCIAL', label: '👥 Social', color: colors.socialBar },
  { value: 'WEALTH', label: '💰 Finances', color: colors.wealthBar },
  { value: 'GENERAL', label: '⭐ Général', color: colors.gold },
];

const DIFFICULTIES = [
  { value: 'EASY', label: '🟢 Facile', xp: 15, stat: 1 },
  { value: 'MEDIUM', label: '🟡 Moyen', xp: 25, stat: 2 },
  { value: 'HARD', label: '🟠 Difficile', xp: 50, stat: 5 },
  { value: 'EPIC', label: '🟣 Épique', xp: 100, stat: 10 },
];

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CreateQuestScreen({ navigation }: CreateQuestScreenProps) {
  // État du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récompenses basées sur la difficulté
  const selectedDifficulty = DIFFICULTIES.find(d => d.value === difficulty)!;

  /**
   * Crée la quête
   */
  async function handleCreate(): Promise<void> {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    
    if (title.trim().length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/quests', {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
      });

      Alert.alert(
        '⚔️ Quête créée!',
        'Bonne chance, héros!',
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
        {/* 📝 TITRE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>⚔️ Titre de la quête *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Faire 30 min de sport"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isSubmitting}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 📝 DESCRIPTION */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>📝 Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Détails de la quête..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
            editable={!isSubmitting}
          />
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🏷️ CATÉGORIE */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>🏷️ Catégorie</Text>
          <Text style={styles.hint}>
            La stat correspondante augmentera à la complétion
          </Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.optionButton,
                  category === cat.value && { 
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
                disabled={isSubmitting}
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
        {/* 💪 DIFFICULTÉ */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>💪 Difficulté</Text>
          <View style={styles.difficultyOptions}>
            {DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff.value}
                style={[
                  styles.difficultyButton,
                  difficulty === diff.value && styles.difficultyButtonSelected,
                ]}
                onPress={() => setDifficulty(diff.value)}
                disabled={isSubmitting}
              >
                <Text style={styles.difficultyLabel}>{diff.label}</Text>
                <Text style={styles.difficultyReward}>+{diff.xp} XP</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* 🎁 RÉSUMÉ RÉCOMPENSES */}
        {/* ═══════════════════════════════════════ */}
        <View style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>🎁 Récompenses</Text>
          <View style={styles.rewardsRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardValue}>+{selectedDifficulty.xp}</Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardValue}>+{selectedDifficulty.stat}</Text>
              <Text style={styles.rewardLabel}>
                {CATEGORIES.find(c => c.value === category)?.label.split(' ')[1] || 'Stat'}
              </Text>
            </View>
          </View>
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
            <Text style={styles.createButtonText}>⚔️ Créer la quête</Text>
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
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Options Grid (Categories)
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  optionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  
  // Difficulty Options
  difficultyOptions: {
    gap: 8,
  },
  difficultyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  difficultyButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  difficultyLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  difficultyReward: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '600',
  },
  
  // Rewards Card
  rewardsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rewardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
  },
  rewardLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  rewardDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
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
