/**
 * DailyProgress.tsx
 * Affiche la progression quotidienne des habitudes avec une barre animée
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface DailyProgressProps {
  goal: number;
  completed: number;
  percentage: number;
}

export default function DailyProgress({ goal, completed, percentage }: DailyProgressProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation de la barre de progression au montage
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isComplete = percentage === 100 && goal > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Objectif du jour</Text>

      {/* Barre de progression */}
      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedWidth,
              backgroundColor: isComplete ? '#00d9a6' : '#3498db',
            },
          ]}
        />
      </View>

      {/* Texte de progression */}
      <Text style={styles.progressText}>
        {completed} / {goal} habitude{goal > 1 ? 's' : ''} complétée{completed > 1 ? 's' : ''}
      </Text>

      {/* Pourcentage */}
      <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>

      {/* Message de félicitation si 100% */}
      {isComplete && (
        <View style={styles.congratsContainer}>
          <Text style={styles.congratsText}>🎉 Journée parfaite !</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eaeaea',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#b8b8b8',
    textAlign: 'center',
    marginBottom: 6,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  congratsContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 217, 166, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9a6',
  },
  congratsText: {
    fontSize: 16,
    color: '#00d9a6',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
