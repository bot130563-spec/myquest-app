/**
 * BottomNav.tsx
 * Barre de navigation inférieure - navigation entre les sections principales
 * 
 * Sections:
 * - Dashboard (accueil)
 * - Quêtes
 * - Journal
 * - Habitudes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Configuration des onglets
const TABS = [
  { name: 'Dashboard', icon: '🏠', label: 'Accueil' },
  { name: 'Quests', icon: '⚔️', label: 'Quêtes' },
  { name: 'Journal', icon: '📓', label: 'Journal' },
  { name: 'Habits', icon: '🔄', label: 'Habitudes' },
];

export default function BottomNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const currentRoute = route.name;

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              isActive && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 20, // Safe area pour iPhone
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 3,
    backgroundColor: '#6c5ce7',
    borderRadius: 2,
  },
});
