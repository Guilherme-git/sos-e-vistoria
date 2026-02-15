import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL da API
const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.0.5:3004';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - limpar autenticação
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }

    // Suprimir logs de erro do axios
    error.isAxiosError = false;

    return Promise.reject(error);
  }
);

// ============================================
// TIPOS
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TowingProvider {
  id: string;
  fantasy_name: string;
  cnpj: string;
}

export interface TowingDriver {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string;
  status: 'available' | 'in_service' | 'banned';
  profile_image_path: string | null;
  towing_provider: TowingProvider;
}

export interface LoginGuincheiroRequest {
  cpf: string;
  password: string;
}

export interface LoginGuincheiroResponse {
  token: string;
  platform_type: 'assistance' | 'inspection';
  user: TowingDriver;
}

export interface Biker {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  status: 'available' | 'busy' | 'not_available' | 'inactive';
}

export interface LoginVistoriadorRequest {
  cpf: string;
  password: string;
}

export interface LoginVistoriadorResponse {
  token: string;
  platform_type: 'assistance' | 'inspection';
  user: Biker;
}

// ============================================
// AUTENTICAÇÃO - GUINCHEIRO
// ============================================

export const guincheiroAuth = {
  /**
   * Login de motorista de guincho
   * POST /api/guincho/auth/login
   */
  login: async (data: LoginGuincheiroRequest): Promise<LoginGuincheiroResponse> => {
    const response = await api.post<ApiResponse<LoginGuincheiroResponse>>(
      '/api/guincho/auth/login',
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao fazer login');
    }

    return response.data.data;
  },

  /**
   * Logout de motorista de guincho
   * POST /api/guincho/auth/logout
   */
  logout: async (): Promise<void> => {
    await api.post('/api/guincho/auth/logout');
  },
};

// ============================================
// AUTENTICAÇÃO - VISTORIADOR
// ============================================

export const vistoriadorAuth = {
  /**
   * Verificar CPF
   * POST /api/vistoria/auth/verify-cpf
   */
  verifyCpf: async (cpf: string): Promise<any> => {
    const response = await api.post('/api/vistoria/auth/verify-cpf', { cpf });
    return response.data;
  },

  /**
   * Login de vistoriador
   * POST /api/vistoria/auth/login
   */
  login: async (data: LoginVistoriadorRequest): Promise<LoginVistoriadorResponse> => {
    const response = await api.post<ApiResponse<LoginVistoriadorResponse>>(
      '/api/vistoria/auth/login',
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao fazer login');
    }

    return response.data.data;
  },

  /**
   * Logout de vistoriador
   * POST /api/vistoria/auth/logout
   */
  logout: async (): Promise<void> => {
    await api.post('/api/vistoria/auth/logout');
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Salvar token e dados do usuário
 */
export const saveAuthData = async (
  token: string,
  userData: TowingDriver | Biker,
  platformType: 'assistance' | 'inspection'
) => {
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('user_data', JSON.stringify(userData));
  await AsyncStorage.setItem('platform_type', platformType);
};

/**
 * Limpar dados de autenticação
 */
export const clearAuthData = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user_data');
  await AsyncStorage.removeItem('platform_type');
};

/**
 * Obter token salvo
 */
export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('auth_token');
};

/**
 * Obter dados do usuário salvos
 */
export const getUserData = async (): Promise<TowingDriver | Biker | null> => {
  const data = await AsyncStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

/**
 * Obter tipo de plataforma salvo
 */
export const getPlatformType = async (): Promise<'assistance' | 'inspection' | null> => {
  return (await AsyncStorage.getItem('platform_type')) as 'assistance' | 'inspection' | null;
};

export default api;
