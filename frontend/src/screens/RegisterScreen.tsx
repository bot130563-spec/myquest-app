/**
 * ==========================================
 * 📝 ÉCRAN D'INSCRIPTION
 * ==========================================
 * 
 * Permet de créer un nouveau compte.
 * Crée automatiquement l'avatar et les stats initiales.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

// Alert compatible web
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  // État du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hook d'authentification
  const { register } = useAuth();

  /**
   * Gère la soumission du formulaire
   */
  async function handleRegister(): Promise<void> {
    console.log('🔥 handleRegister appelé!', { email, password: '***', confirmPassword: '***' });
    
    // ── VALIDATION ──
    if (!email.trim() || !password) {
      showAlert('Erreur', 'Email et mot de passe sont requis');
      return;
    }
    
    if (password.length < 8) {
      showAlert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (password !== confirmPassword) {
      showAlert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(
        email.trim().toLowerCase(),
        password,
        name.trim() || undefined,
        avatarName.trim() || undefined
      );
      // La navigation vers Home est automatique
      
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Une erreur est survenue';
      
      showAlert('Erreur d\'inscription', message);
      
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════════════════════════════ */}
          {/* 🎮 HEADER */}
          {/* ══════════════════════════════════ */}
          <View style={styles.header}>
            <Text style={styles.logo}>⚔️</Text>
            <Text style={styles.title}>Rejoins l'aventure!</Text>
            <Text style={styles.subtitle}>Crée ton compte et commence ta quête</Text>
          </View>

          {/* ══════════════════════════════════ */}
          {/* 📝 FORMULAIRE */}
          {/* ══════════════════════════════════ */}
          <View style={styles.form}>
            {/* Email (requis) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>📧 Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>

            {/* Mot de passe (requis) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 Mot de passe * (min. 8 caractères)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            {/* Confirmation mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 Confirmer le mot de passe *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            {/* Séparateur */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Optionnel</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Nom (optionnel) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>👤 Ton prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Comment t'appelles-tu?"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>

            {/* Nom d'avatar (optionnel) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>🦸 Nom de ton héros</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: SuperWarrior, Phoenix..."
                placeholderTextColor={colors.textMuted}
                value={avatarName}
                onChangeText={setAvatarName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
              <Text style={styles.hint}>
                Tu pourras le changer plus tard
              </Text>
            </View>

            {/* Bouton Inscription */}
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <Text style={styles.buttonText}>🚀 Commencer l'aventure</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ══════════════════════════════════ */}
          {/* 🔗 LIEN CONNEXION */}
          {/* ══════════════════════════════════ */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={isSubmitting}
            >
              <Text style={styles.linkText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  
  // Form
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
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
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: 16,
    fontSize: 12,
  },
  
  // Button
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
