/**
 * ==========================================
 * 🎮 MYQUEST APP - POINT D'ENTRÉE FRONTEND
 * ==========================================
 * 
 * Ce fichier est le composant racine de l'app React Native.
 * Il gère:
 * - L'authentification (AuthProvider)
 * - La navigation conditionnelle (Auth vs App)
 * - Le thème visuel
 * 
 * FLUX DE NAVIGATION:
 * 
 * Non connecté:          Connecté:
 * ┌─────────────┐        ┌─────────────┐
 * │   Login     │        │    Home     │
 * ├─────────────┤        ├─────────────┤
 * │  Register   │        │   Avatar    │ (à venir)
 * └─────────────┘        │   Stats     │ (à venir)
 *                        │   Quests    │ (à venir)
 *                        └─────────────┘
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexte d'authentification
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Écrans
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import CreateQuestScreen from './src/screens/CreateQuestScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import CreateHabitScreen from './src/screens/CreateHabitScreen';
import JournalScreen from './src/screens/JournalScreen';
import CoachScreen from './src/screens/CoachScreen';

// Thème
import { colors } from './src/theme/colors';

// ============================================
// 📝 TYPES DE NAVIGATION
// ============================================

// Stack pour les utilisateurs NON connectés
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tabs pour la navigation principale
export type MainTabParamList = {
  Dashboard: undefined;
  Quests: undefined;
  Coach: undefined;
  Journal: undefined;
  Habits: undefined;
};

// Stack pour les utilisateurs connectés (inclut les tabs + modals)
export type AppStackParamList = {
  MainTabs: undefined;
  CreateQuest: undefined;
  CreateHabit: undefined;
  // Avatar: undefined;
  // Settings: undefined;
};

// Crée les navigateurs
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// ============================================
// 🔐 NAVIGATEUR AUTH (non connecté)
// ============================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,  // Pas de header sur les écrans d'auth
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ============================================
// 📱 NAVIGATEUR TABS (onglets principaux)
// ============================================

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <MainTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Accueil',
          headerTitle: 'MyQuest',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>🏠</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="Quests" 
        component={QuestsScreen}
        options={{
          title: 'Quêtes',
          headerTitle: 'Mes Quêtes',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>⚔️</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="Coach" 
        component={CoachScreen}
        options={{
          title: 'Coach',
          headerTitle: 'Coach IA',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>🤖</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="Journal" 
        component={JournalScreen}
        options={{
          title: 'Journal',
          headerTitle: 'Mon Journal',
          headerShown: false, // Le JournalScreen a son propre header
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>📓</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="Habits" 
        component={HabitsScreen}
        options={{
          title: 'Habitudes',
          headerTitle: 'Mes Habitudes',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>🔄</Text>
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// ============================================
// 🏠 NAVIGATEUR APP (connecté)
// ============================================

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <AppStack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          headerShown: false, // Les tabs ont leur propre header
        }}
      />
      <AppStack.Screen 
        name="CreateQuest" 
        component={CreateQuestScreen}
        options={{
          title: 'Nouvelle Quête',
          presentation: 'modal',
        }}
      />
      <AppStack.Screen 
        name="CreateHabit" 
        component={CreateHabitScreen}
        options={{
          title: 'Nouvelle Habitude',
          presentation: 'modal',
        }}
      />
      {/* TODO: Ajouter les écrans suivants
      <AppStack.Screen name="Avatar" component={AvatarScreen} />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
      */}
    </AppStack.Navigator>
  );
}

// ============================================
// 🔀 SÉLECTEUR DE NAVIGATION
// ============================================
// Affiche Auth ou App selon l'état de connexion

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // ── ÉCRAN DE CHARGEMENT ──
  // Pendant qu'on vérifie si un token existe
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  
  // ── NAVIGATION CONDITIONNELLE ──
  // Si connecté → App, sinon → Auth
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================

export default function App() {
  return (
    // SafeAreaProvider: gère les zones sûres (notch, etc.)
    <SafeAreaProvider>
      {/* AuthProvider: fournit le contexte d'auth à toute l'app */}
      <AuthProvider>
        {/* NavigationContainer: contexte de navigation */}
        <NavigationContainer>
          {/* StatusBar: style de la barre de status */}
          <StatusBar style="light" />
          
          {/* Navigation principale */}
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
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
});
