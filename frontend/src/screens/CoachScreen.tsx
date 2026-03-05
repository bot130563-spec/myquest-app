/**
 * ==========================================
 * 🧠 COACH V2 — Routeur principal
 * ==========================================
 *
 * Gère la navigation entre les 3 sous-écrans du coach :
 * - Onboarding (si pas encore fait)
 * - Dashboard (vue d'ensemble)
 * - Chat (session de coaching)
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../config/api';
import CoachOnboardingScreen from './CoachOnboardingScreen';
import CoachDashboardScreen from './CoachDashboardScreen';
import CoachChatScreen from './CoachChatScreen';

// ============================================
// 📦 TYPES
// ============================================

type CoachView = 'loading' | 'onboarding' | 'dashboard' | 'chat';

interface ProfileStatus {
  onboardingDone: boolean;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function CoachScreen() {
  const [currentView, setCurrentView] = useState<CoachView>('loading');

  // Vérifier le statut du profil au montage
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await api.get<any>('/coach/profile');
      const done = response?.profile?.onboardingDone ?? response?.onboardingDone ?? false;
      setCurrentView(done ? 'dashboard' : 'onboarding');
    } catch (err: any) {
      console.error('Erreur vérification profil coach:', err);
      // Si 404 ou erreur → onboarding
      setCurrentView('onboarding');
    }
  };

  // Callback après l'onboarding
  const handleOnboardingComplete = () => {
    setCurrentView('dashboard');
  };

  // Ouvrir le chat depuis le dashboard
  const handleStartChat = () => {
    setCurrentView('chat');
  };

  // Retour au dashboard depuis le chat
  const handleBackFromChat = () => {
    setCurrentView('dashboard');
  };

  // Écran de chargement
  if (currentView === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Router
  switch (currentView) {
    case 'onboarding':
      return <CoachOnboardingScreen onComplete={handleOnboardingComplete} />;
    case 'dashboard':
      return <CoachDashboardScreen onStartChat={handleStartChat} />;
    case 'chat':
      return <CoachChatScreen onBack={handleBackFromChat} />;
    default:
      return null;
  }
}

// ============================================
// 🎨 STYLES
// ============================================

const styles = StyleSheet.create({
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
});
