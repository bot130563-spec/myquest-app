/**
 * ==========================================
 * 🔑 ÉCRAN DE CONNEXION
 * ==========================================
 * 
 * Permet à un utilisateur existant de se connecter.
 * Redirige vers l'inscription si pas de compte.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function LoginScreen({ navigation }: LoginScreenProps) {
  // État du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hook d'authentification
  const { login } = useAuth();

  /**
   * Gère la soumission du formulaire
   */
  async function handleLogin(): Promise<void> {
    // Validation basique
    if (!email.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email.trim().toLowerCase(), password);
      // La navigation vers Home est automatique grâce au AuthContext
      
    } catch (error) {
      // Affiche l'erreur à l'utilisateur
      const message = error instanceof ApiError 
        ? error.message 
        : 'Une erreur est survenue';
      
      Alert.alert('Erreur de connexion', message);
      
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
        {/* ══════════════════════════════════ */}
        {/* 🎮 HEADER */}
        {/* ══════════════════════════════════ */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎮</Text>
          <Text style={styles.title}>MyQuest</Text>
          <Text style={styles.subtitle}>Bon retour, héros!</Text>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 📝 FORMULAIRE */}
        {/* ══════════════════════════════════ */}
        <View style={styles.form}>
          {/* Champ Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📧 Email</Text>
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

          {/* Champ Mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔒 Mot de passe</Text>
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

          {/* Bouton Connexion */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════ */}
        {/* 🔗 LIEN INSCRIPTION */}
        {/* ══════════════════════════════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte?</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')}
            disabled={isSubmitting}
          >
            <Text style={styles.linkText}>Créer un compte</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  
  // Form
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
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
