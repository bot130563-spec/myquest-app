/**
 * ==========================================
 * 🌐 CONFIGURATION API
 * ==========================================
 * 
 * Configure la connexion au backend.
 * Gère automatiquement dev (localhost) vs prod (Render).
 * 
 * USAGE:
 * import { api } from '../config/api';
 * const response = await api.post('/auth/login', { email, password });
 */

// ============================================
// 🔧 URL DE BASE
// ============================================
// __DEV__ est une variable globale React Native
// true en développement, false après build

const DEV_API_URL = 'http://192.168.1.83:3000';

// TODO: Remplacer par ton URL Render après déploiement
const PROD_API_URL = 'https://myquest-api.onrender.com';

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// ============================================
// 📦 TYPES
// ============================================

// Réponse générique de l'API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Erreur API
export class ApiError extends Error {
  status: number;
  details?: string[];
  
  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ============================================
// 🔑 GESTION DU TOKEN
// ============================================
// Le token est stocké en mémoire pour l'instant
// TODO: Utiliser AsyncStorage pour persister entre les sessions

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// ============================================
// 📡 FONCTION FETCH WRAPPER
// ============================================

/**
 * Effectue une requête à l'API
 * @param endpoint - Chemin de l'endpoint (ex: '/auth/login')
 * @param options - Options fetch (method, body, etc.)
 * @returns Les données de la réponse
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Construit l'URL complète
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  // Headers par défaut
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Ajoute le token si présent
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Log pour debug
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
  
  // Timeout de 15 secondes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Parse la réponse JSON
    const data = await response.json();
    
    console.log(`✅ API Response: ${response.status}`);
    
    // Si erreur HTTP, throw une ApiError
    if (!response.ok) {
      throw new ApiError(
        data.message || 'Une erreur est survenue',
        response.status,
        data.details
      );
    }
    
    return data as T;
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Log l'erreur pour debug
    console.error(`❌ API Error:`, error.name, error.message);
    
    // Si c'est déjà une ApiError, on la propage
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Timeout
    if (error.name === 'AbortError') {
      throw new ApiError('Délai de connexion dépassé (timeout)', 0);
    }
    
    // Erreur réseau ou autre - inclut le message original pour debug
    throw new ApiError(
      `Impossible de contacter le serveur: ${error.message}`,
      0
    );
  }
}

// ============================================
// 🛠️ MÉTHODES HTTP SIMPLIFIÉES
// ============================================

export const api = {
  /**
   * GET request
   * @example api.get('/user/profile')
   */
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
  
  /**
   * POST request
   * @example api.post('/auth/login', { email, password })
   */
  post: <T>(endpoint: string, body?: unknown) => 
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  /**
   * PUT request
   * @example api.put('/user/avatar', { name: 'Hero' })
   */
  put: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  /**
   * DELETE request
   * @example api.delete('/quests/123')
   */
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
