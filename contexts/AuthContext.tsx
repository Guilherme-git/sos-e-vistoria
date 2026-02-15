import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TowingDriver,
  Biker,
  guincheiroAuth,
  vistoriadorAuth,
  saveAuthData,
  clearAuthData,
  getAuthToken,
  getUserData,
  getPlatformType
} from '@/lib/api';

export type UserRole = 'guincheiro' | 'vistoriador';

// Tipo unificado de usuário
export type User = (TowingDriver | Biker) & { role: UserRole };

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  role: UserRole | null;
  platformType: 'assistance' | 'inspection' | null;
  loginGuincheiro: (cpf: string, password: string) => Promise<void>;
  loginVistoriador: (cpf: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [platformType, setPlatformType] = useState<'assistance' | 'inspection' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados salvos ao iniciar o app
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await getAuthToken();
      const savedUserData = await getUserData();
      const savedPlatformType = await getPlatformType();

      if (savedToken && savedUserData && savedPlatformType) {
        // Determinar o role baseado no platform_type
        const role: UserRole = savedPlatformType === 'assistance' ? 'guincheiro' : 'vistoriador';
        setToken(savedToken);
        setPlatformType(savedPlatformType);
        setUser({ ...savedUserData, role } as User);
      }
    } catch (error) {
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const loginGuincheiro = async (cpf: string, password: string) => {
    try {
      setIsLoading(true);

      // Remover caracteres especiais do CPF
      const cleanCpf = cpf.replace(/[^\d]/g, '');

      // Fazer login na API
      const response = await guincheiroAuth.login({
        cpf: cleanCpf,
        password
      });

      // Salvar token, dados do usuário e platform_type
      await saveAuthData(response.token, response.user, response.platform_type);

      // Atualizar estado
      setToken(response.token);
      setPlatformType(response.platform_type);
      setUser({ ...response.user, role: 'guincheiro' });
    } catch (error: any) {
      // Não logar erro no console
      throw new Error(error.response?.data?.error || error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const loginVistoriador = async (cpf: string, password: string) => {
    try {
      setIsLoading(true);

      // Remover caracteres especiais do CPF
      const cleanCpf = cpf.replace(/[^\d]/g, '');

      // Fazer login na API
      const response = await vistoriadorAuth.login({
        cpf: cleanCpf,
        password
      });

      // Salvar token, dados do usuário e platform_type
      await saveAuthData(response.token, response.user, response.platform_type);

      // Atualizar estado
      setToken(response.token);
      setPlatformType(response.platform_type);
      setUser({ ...response.user, role: 'vistoriador' });
    } catch (error: any) {
      // Não logar erro no console
      throw new Error(error.response?.data?.error || error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Chamar endpoint de logout na API
      if (user?.role === 'guincheiro') {
        await guincheiroAuth.logout();
      } else if (user?.role === 'vistoriador') {
        await vistoriadorAuth.logout();
      }
    } catch (error) {
      // Continuar mesmo se der erro na API
    } finally {
      // Limpar todos os dados locais
      await clearAuthData();
      await AsyncStorage.removeItem('calls'); // Limpar chamados
      setUser(null);
      setToken(null);
      setPlatformType(null);
    }
  };

  const value = useMemo(() => ({
    isAuthenticated: !!user && !!token,
    isLoading,
    user,
    token,
    role: user?.role || null,
    platformType,
    loginGuincheiro,
    loginVistoriador,
    logout,
  }), [user, token, platformType, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
