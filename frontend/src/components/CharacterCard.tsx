/**
 * CharacterCard.tsx
 * Carte de personnage RPG avec avatar, niveau, XP et stats animées
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Stats {
  health: number;
  energy: number;
  wisdom: number;
  social: number;
  wealth: number;
}

interface User {
  name: string;
  level: number;
  experience: number;
  xpForNextLevel: number;
  totalXp: number;
}

interface CharacterCardProps {
  user: User;
  stats: Stats;
  streak: number;
}

// Configuration des stats avec icônes et couleurs
const STAT_CONFIG = [
  { key: 'health', iconType: 'Ionicons', iconName: 'heart', label: 'Santé', color: '#e74c3c', max: 100 },
  { key: 'energy', iconType: 'Ionicons', iconName: 'flash', label: 'Énergie', color: '#f39c12', max: 100 },
  { key: 'wisdom', iconType: 'Ionicons', iconName: 'book', label: 'Sagesse', color: '#3498db', max: 100 },
  { key: 'social', iconType: 'Ionicons', iconName: 'people', label: 'Social', color: '#9b59b6', max: 100 },
  { key: 'wealth', iconType: 'Ionicons', iconName: 'cash', label: 'Richesse', color: '#27ae60', max: 100 },
] as const;

// Fonction pour déterminer l'emoji selon le niveau
const getAvatarEmoji = (level: number): string => {
  if (level >= 10) return '👑';
  if (level >= 7) return '🧙';
  if (level >= 4) return '⚔️';
  return '🧑';
};

// Fonction pour déterminer le titre selon le niveau
const getCharacterTitle = (level: number): string => {
  if (level >= 10) return 'Maître Légendaire';
  if (level >= 7) return 'Sage Éclairé';
  if (level >= 4) return 'Guerrier Confirmé';
  return 'Aventurier';
};

// Fonction pour déterminer la couleur de fond selon le niveau
const getAvatarBackgroundColor = (level: number): string => {
  if (level >= 10) return '#FFD700'; // Or
  if (level >= 7) return '#9b59b6'; // Violet
  if (level >= 4) return '#3498db'; // Bleu
  return '#95a5a6'; // Gris
};

export default function CharacterCard({ user, stats, streak }: CharacterCardProps) {
  // Animations pour les barres de stats
  const statAnimations = useRef(
    STAT_CONFIG.map(() => new Animated.Value(0))
  ).current;

  // Animation pour le pulse de l'avatar
  const avatarScale = useRef(new Animated.Value(1)).current;

  // Animation d'entrée des stats au montage
  useEffect(() => {
    // Animer toutes les barres de stats
    const animations = statAnimations.map((anim, index) => {
      const statKey = STAT_CONFIG[index].key as keyof Stats;
      const value = stats[statKey] / STAT_CONFIG[index].max;

      return Animated.timing(anim, {
        toValue: value,
        duration: 800,
        delay: index * 100,
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();

    // Animation de pulse pour l'avatar (en boucle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScale, {
          toValue: 1.03,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(avatarScale, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [stats]);

  const xpPercentage = (user.experience / user.xpForNextLevel) * 100;
  const avatarEmoji = getAvatarEmoji(user.level);
  const characterTitle = getCharacterTitle(user.level);
  const avatarBgColor = getAvatarBackgroundColor(user.level);

  return (
    <View style={styles.card}>
      {/* Avatar du personnage */}
      <Animated.View
        style={[
          styles.avatarContainer,
          { backgroundColor: avatarBgColor },
          { transform: [{ scale: avatarScale }] }
        ]}
      >
        <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
      </Animated.View>

      {/* Nom du personnage + Niveau */}
      <Text style={styles.characterName}>
        {characterTitle} • Nv.{user.level}
      </Text>

      {/* Barre XP */}
      <View style={styles.xpContainer}>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${xpPercentage}%` }]} />
        </View>
        <Text style={styles.xpText}>
          XP: {user.experience}/{user.xpForNextLevel}
        </Text>
      </View>

      {/* Grille de stats */}
      <View style={styles.statsContainer}>
        {STAT_CONFIG.map((config, index) => {
          const statKey = config.key as keyof Stats;
          const value = stats[statKey];
          const animatedWidth = statAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          });

          const IconComponent = config.iconType === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

          return (
            <View key={config.key} style={styles.statRow}>
              <View style={styles.statHeader}>
                <IconComponent name={config.iconName as any} size={18} color={config.color} style={styles.statIconVector} />
                <Text style={styles.statLabel}>{config.label}</Text>
              </View>
              <View style={styles.statBarContainer}>
                <View style={styles.statBarBackground}>
                  <Animated.View
                    style={[
                      styles.statBarFill,
                      {
                        width: animatedWidth,
                        backgroundColor: config.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{value}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bannière streak */}
      {streak > 0 && (
        <View style={styles.streakBanner}>
          <MaterialCommunityIcons name="fire" size={20} color="#ff6b00" style={{ marginRight: 8 }} />
          <Text style={styles.streakText}>
            {streak} jour{streak > 1 ? 's' : ''} de suite
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarEmoji: {
    fontSize: 60,
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  xpContainer: {
    width: '100%',
    marginBottom: 24,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIconVector: {
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#eaeaea',
    fontWeight: '500',
  },
  statBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  statBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    width: 35,
    textAlign: 'right',
  },
  streakBanner: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff6b00',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 16,
    color: '#ff6b00',
    fontWeight: 'bold',
  },
});
