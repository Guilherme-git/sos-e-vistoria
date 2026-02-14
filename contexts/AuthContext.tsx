import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'guincheiro' | 'vistoriador';

interface Driver {
  cnpjCpf: string;
  cpf: string;
  name: string;
  phone: string;
  company: string;
  photoUri?: string;
  role: UserRole;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  driver: Driver | null;
  role: UserRole | null;
  login: (driver: Driver) => Promise<void>;
  logout: () => Promise<void>;
  updatePhoto: (uri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('driver').then((data) => {
      if (data) {
        setDriver(JSON.parse(data));
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (d: Driver) => {
    setDriver(d);
    await AsyncStorage.setItem('driver', JSON.stringify(d));
  };

  const logout = async () => {
    setDriver(null);
    await AsyncStorage.removeItem('driver');
  };

  const updatePhoto = async (uri: string) => {
    if (driver) {
      const updated = { ...driver, photoUri: uri };
      setDriver(updated);
      await AsyncStorage.setItem('driver', JSON.stringify(updated));
    }
  };

  const value = useMemo(() => ({
    isAuthenticated: !!driver,
    isLoading,
    driver,
    role: driver?.role || null,
    login,
    logout,
    updatePhoto,
  }), [driver, isLoading]);

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
