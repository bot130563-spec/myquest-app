/**
 * ==========================================
 * 🎮 MYQUEST APP - POINT D'ENTRÉE FRONTEND
 * ==========================================
 * 
 * Ce fichier est le composant racine de l'app React Native.
 * Il configure:
 * - La navigation entre écrans
 * - Le thème visuel (couleurs, styles)
 * - Les providers (contextes globaux)
 * 
 * STRUCTURE DE NAVIGATION:
 * App
 * └── NavigationContainer (gère l'historique de navigation)
 *     └── Stack.Navigator (navigation par pile, comme un navigateur)
 *         ├── HomeScreen (écran d'accueil)
 *         ├── QuestScreen (détail d'une quête) - à venir
 *         ├── AvatarScreen (personnalisation) - à venir
 *         └── etc.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Nos composants et styles
import HomeScreen from './src/screens/HomeScreen';
import { colors } from './src/theme/colors';

// ============================================
// 📝 TYPES TYPESCRIPT - Définition des routes
// ============================================
// TypeScript a besoin de connaître les routes et leurs paramètres
// Ça permet l'autocomplétion et évite les erreurs de typo

export type RootStackParamList = {
  // Home n'a pas de paramètres (undefined)
  Home: undefined;
  
  // Exemples pour les futures routes:
  // Quest: { questId: string };      // ID de la quête à afficher
  // Avatar: undefined;                // Pas de params
  // Stats: undefined;
  // Settings: undefined;
};

// Crée le navigateur typé avec nos routes
const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================
// 🎯 COMPOSANT PRINCIPAL
// ============================================
export default function App() {
  return (
    // SafeAreaProvider: gère les zones sûres (notch, barre de status)
    // Évite que le contenu soit caché sous la barre de notification
    <SafeAreaProvider>
      
      {/* NavigationContainer: contexte de navigation obligatoire */}
      {/* Gère l'état de navigation (où on est, historique) */}
      <NavigationContainer>
        
        {/* StatusBar: contrôle l'apparence de la barre de status */}
        {/* style="light" = texte blanc (pour fond sombre) */}
        <StatusBar style="light" />
        
        {/* Stack.Navigator: navigation "pile" (push/pop comme un browser) */}
        <Stack.Navigator
          // Écran affiché au lancement
          initialRouteName="Home"
          
          // Options par défaut pour TOUS les écrans
          screenOptions={{
            // Style du header (barre du haut)
            headerStyle: {
              backgroundColor: colors.primary,  // Fond sombre
            },
            // Couleur du texte/icônes du header
            headerTintColor: colors.textLight,  // Blanc
            // Style du titre
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            // Fond de l'écran (derrière le contenu)
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          {/* ── DÉFINITION DES ÉCRANS ── */}
          
          {/* Écran d'accueil */}
          <Stack.Screen 
            name="Home"                    // Nom de la route (pour navigation.navigate('Home'))
            component={HomeScreen}         // Composant à afficher
            options={{
              title: 'MyQuest',            // Titre dans le header
              headerLargeTitle: true,      // Grand titre iOS style
            }}
          />
          
          {/* TODO: Ajouter les écrans suivants:
          
          <Stack.Screen 
            name="Quest" 
            component={QuestScreen}
            options={({ route }) => ({
              title: route.params?.questTitle || 'Quête',
            })}
          />
          
          <Stack.Screen 
            name="Avatar" 
            component={AvatarScreen}
            options={{ title: 'Mon Avatar' }}
          />
          
          <Stack.Screen 
            name="Stats" 
            component={StatsScreen}
            options={{ title: 'Mes Statistiques' }}
          />
          
          */}
          
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ============================================
// 📝 NOTES POUR LA SUITE
// ============================================
//
// PROVIDERS À AJOUTER:
// - AuthContext: état de connexion (user, token)
// - ThemeContext: si on veut un mode clair/sombre
// - QueryClientProvider: pour React Query (cache API)
//
// Exemple de structure avec providers:
//
// <SafeAreaProvider>
//   <AuthProvider>
//     <QueryClientProvider client={queryClient}>
//       <NavigationContainer>
//         ...
//       </NavigationContainer>
//     </QueryClientProvider>
//   </AuthProvider>
// </SafeAreaProvider>
