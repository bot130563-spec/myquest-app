/**
 * ==========================================
 * 🔐 CONTEXTE D'AUTHENTIFICATION
 * ==========================================
 * 
 * Gère l'état de connexion de l'utilisateur dans toute l'app.
 * Fournit les fonctions login, register, logout.
 * 
 * USAGE:
 * // Dans un composant
 * const { user, login, logout, isLoading } = useAuth();
 * 
 * // Vérifier si connecté
 * if (user) { ... }
 * 
 * // Se connecter
 * await login(email, password);
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, ApiError } from '../config/api';

// ============================================
// 📦 TYPES
// ============================================

// Structure de l'avatar (depuis l'API)
interface Avatar {
  id: string;
  name: string;
  level: number;
  experience: number;
  avatarType: string;
  appearance: Record<string, unknown>;
}

// Structure des stats (depuis l'API)
interface Stats {
  id: string;
  health: number;
  energy: number;
  wisdom: number;
  social: number;
  wealth: number;
  currentStreak: number;
  longestStreak: number;
}

// Structure de l'utilisateur
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  avatar: Avatar | null;
  stats: Stats | null;
}

// Réponse de l'API auth
interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Ce que le contexte expose
interface AuthContextType {
  user: User | null;           // Utilisateur connecté (ou null)
  isLoading: boolean;          // Chargement initial (vérif token)
  isAuthenticated: boolean;    // Raccourci pour user !== null
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, avatarName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// 🎯 CRÉATION DU CONTEXTE
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé pour AsyncStorage
const TOKEN_KEY = '@myquest_token';

// ============================================
// 🏠 PROVIDER - Wrapper de l'app
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // État de l'utilisateur
  const [user, setUser] = useState<User | null>(null);
  
  // Chargement initial (vérifie si un token existe)
  const [isLoading, setIsLoading] = useState(true);

  // ── EFFET: Vérifier le token au démarrage ──
  useEffect(() => {
    checkStoredToken();
  }, []);

  /**
   * Vérifie si un token est stocké et s'il est encore valide
   */
  async function checkStoredToken(): Promise<void> {
    try {
      // Récupère le token depuis AsyncStorage
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      if (token) {
        // Configure le token pour les requêtes
        setAuthToken(token);
        
        // Vérifie que le token est valide en appelant /auth/me
        const response = await api.get<{ user: User }>('/auth/me');
        setUser(response.user);
      }
    } catch (error) {
      // Token invalide ou expiré → on le supprime
      console.log('Token invalide, déconnexion');
      await AsyncStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Connecte l'utilisateur
   */
  async function login(email: string, password: string): Promise<void> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    // Stocke le token
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setAuthToken(response.token);
    
    // Met à jour l'état
    setUser(response.user);
  }

  /**
   * Inscrit un nouvel utilisateur
   */
  async function register(
    email: string,
    password: string,
    name?: string,
    avatarName?: string
  ): Promise<void> {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
      avatarName,
    });
    
    // Stocke le token
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setAuthToken(response.token);
    
    // Met à jour l'état
    setUser(response.user);
  }

  /**
   * Déconnecte l'utilisateur
   */
  async function logout(): Promise<void> {
    // Supprime le token
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    
    // Reset l'état
    setUser(null);
  }

  /**
   * Rafraîchit les données de l'utilisateur
   */
  async function refreshUser(): Promise<void> {
    if (!user) return;
    
    const response = await api.get<{ user: User }>('/auth/me');
    setUser(response.user);
  }

  // ── VALEUR DU CONTEXTE ──
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// 🪝 HOOK PERSONNALISÉ
// ============================================

/**
 * Hook pour accéder au contexte d'auth
 * @throws Error si utilisé hors du Provider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
}
