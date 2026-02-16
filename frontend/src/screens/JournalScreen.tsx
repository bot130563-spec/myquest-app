/**
 * JournalScreen.tsx
 * Écran de journal quotidien - capture l'humeur, les gratitudes et réflexions
 * 
 * Fonctionnalités:
 * - Sélection d'humeur avec emojis (1-5)
 * - Liste de gratitudes (3 champs)
 * - Zone de réflexion libre
 * - Objectif du jour
 * - Tags optionnels
 * - Récompense: 15 XP + boost sagesse sur première entrée quotidienne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';

// Configuration des humeurs avec emojis et labels
const MOODS = [
  { value: 1, emoji: '😢', label: 'Difficile', color: '#e74c3c' },
  { value: 2, emoji: '😕', label: 'Pas top', color: '#e67e22' },
  { value: 3, emoji: '😐', label: 'Neutre', color: '#f39c12' },
  { value: 4, emoji: '🙂', label: 'Bien', color: '#27ae60' },
  { value: 5, emoji: '😄', label: 'Super !', color: '#2ecc71' },
];

// Questions inspirantes pour la réflexion
const PROMPTS = [
  "Qu'est-ce qui t'a rendu fier aujourd'hui ?",
  "Quel défi as-tu surmonté récemment ?",
  "Qu'as-tu appris de nouveau ?",
  "Comment as-tu pris soin de toi aujourd'hui ?",
  "Quelle petite victoire mérite d'être célébrée ?",
];

export default function JournalScreen() {
  // États du formulaire
  const [mood, setMood] = useState<number>(3);
  const [gratitudes, setGratitudes] = useState<string[]>(['', '', '']);
  const [reflection, setReflection] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [tags, setTags] = useState('');
  
  // États de l'interface
  const [loading, setLoading] = useState(false);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [checkingToday, setCheckingToday] = useState(true);
  const [randomPrompt, setRandomPrompt] = useState('');
  
  // Token is handled internally by API module

  // Vérifier si une entrée existe déjà aujourd'hui
  useEffect(() => {
    checkTodayEntry();
    // Sélectionner une question inspirante aléatoire
    setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  /**
   * Vérifie si l'utilisateur a déjà écrit dans son journal aujourd'hui
   */
  const checkTodayEntry = async () => {
    try {
      const data = await api.get<{ entry: any }>('/journal/today');
      if (data.entry) {
        setTodayEntry(data.entry);
        // Pré-remplir avec les données existantes
        setMood(data.entry.mood);
        setGratitudes(data.entry.gratitudes || ['', '', '']);
        setReflection(data.entry.reflection || '');
        setDailyGoal(data.entry.dailyGoal || '');
        setTags(data.entry.tags?.join(', ') || '');
      }
    } catch (error) {
      console.error('Erreur vérification journal:', error);
    } finally {
      setCheckingToday(false);
    }
  };

  /**
   * Met à jour une gratitude dans la liste
   */
  const updateGratitude = (index: number, value: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = value;
    setGratitudes(newGratitudes);
  };

  /**
   * Sauvegarde l'entrée du journal
   * Crée une nouvelle entrée ou met à jour celle existante
   */
  const saveEntry = async () => {
    // Validation: au moins l'humeur et une gratitude
    const filledGratitudes = gratitudes.filter(g => g.trim());
    if (filledGratitudes.length === 0) {
      Alert.alert('Oups !', 'Écris au moins une gratitude 🙏');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<any>('/journal', {
        mood,
        gratitudes: filledGratitudes,
        reflection: reflection.trim() || undefined,
        dailyGoal: dailyGoal.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(t => t) || undefined,
      });

      const xpMessage = data.xpAwarded 
        ? `\n\n🎮 +${data.xpAwarded} XP gagnés !` 
        : '';
      
      Alert.alert(
        todayEntry ? '📝 Mis à jour !' : '✨ Enregistré !',
        `Ton journal du jour est sauvegardé.${xpMessage}`,
        [{ text: 'Super !', style: 'default' }]
      );
      
      setTodayEntry(data.entry);
    } catch (error: any) {
      console.error('Erreur sauvegarde journal:', error);
      Alert.alert('Erreur', error.message || 'Problème de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Affichage de chargement initial
  if (checkingToday) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Chargement du journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête avec date */}
      <View style={styles.header}>
        <Text style={styles.title}>📓 Mon Journal</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        {todayEntry && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedBadgeText}>✓ Déjà écrit aujourd'hui</Text>
          </View>
        )}
      </View>

      {/* Sélecteur d'humeur */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comment te sens-tu ?</Text>
        <View style={styles.moodContainer}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.moodButton,
                mood === m.value && { backgroundColor: m.color },
              ]}
              onPress={() => setMood(m.value)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                mood === m.value && styles.moodLabelSelected,
              ]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section gratitudes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🙏 3 gratitudes du jour</Text>
        <Text style={styles.sectionHint}>
          De quoi es-tu reconnaissant aujourd'hui ?
        </Text>
        {gratitudes.map((g, index) => (
          <TextInput
            key={index}
            style={styles.gratitudeInput}
            placeholder={`Gratitude ${index + 1}...`}
            placeholderTextColor="#999"
            value={g}
            onChangeText={(value) => updateGratitude(index, value)}
            maxLength={200}
          />
        ))}
      </View>

      {/* Objectif du jour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Objectif du jour</Text>
        <TextInput
          style={styles.goalInput}
          placeholder="Quel est ton objectif principal aujourd'hui ?"
          placeholderTextColor="#999"
          value={dailyGoal}
          onChangeText={setDailyGoal}
          maxLength={200}
        />
      </View>

      {/* Réflexion libre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💭 Réflexion</Text>
        <Text style={styles.sectionHint}>{randomPrompt}</Text>
        <TextInput
          style={styles.reflectionInput}
          placeholder="Écris tes pensées..."
          placeholderTextColor="#999"
          value={reflection}
          onChangeText={setReflection}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={2000}
        />
      </View>

      {/* Tags optionnels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏷️ Tags (optionnel)</Text>
        <TextInput
          style={styles.tagsInput}
          placeholder="travail, famille, sport..."
          placeholderTextColor="#999"
          value={tags}
          onChangeText={setTags}
          maxLength={100}
        />
      </View>

      {/* Bouton de sauvegarde */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={saveEntry}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {todayEntry ? '📝 Mettre à jour' : '✨ Enregistrer (+15 XP)'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info XP */}
      {!todayEntry && (
        <Text style={styles.xpInfo}>
          💡 La première entrée du jour te rapporte 15 XP et booste ta sagesse !
        </Text>
      )}

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
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#6c5ce7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  savedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  savedBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginHorizontal: 4,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  moodLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  gratitudeInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
    color: '#2d3436',
  },
  goalInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2d3436',
  },
  reflectionInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    color: '#2d3436',
  },
  tagsInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2d3436',
  },
  saveButton: {
    backgroundColor: '#6c5ce7',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  xpInfo: {
    textAlign: 'center',
    color: '#636e72',
    fontSize: 13,
    marginTop: 12,
    marginHorizontal: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
