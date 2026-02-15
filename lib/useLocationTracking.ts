import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';

const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.0.5:3004';

export type LocationStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'permission_denied';

export interface LocationTrackingState {
  status: LocationStatus;
  lastUpdate: Date | null;
  error: string | null;
  needsPermission: boolean;
  needsGpsEnabled: boolean;
}

export function useLocationTracking(token: string | null, enabled: boolean = true) {
  const [state, setState] = useState<LocationTrackingState>({
    status: 'disconnected',
    lastUpdate: null,
    error: null,
    needsPermission: false,
    needsGpsEnabled: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Não iniciar se não tiver token ou estiver desabilitado
    if (!token || !enabled) {
      cleanup();
      isInitializedRef.current = false;
      return;
    }

    // Evitar inicializar múltiplas vezes
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // Inicializar WebSocket
    initializeWebSocket();

    // Iniciar rastreamento de localização
    startLocationTracking();

    // Listener para verificar permissão e GPS quando app volta ao foco
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App voltou ao primeiro plano

        // Verificar permissão
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted' && state.needsPermission) {
          // Permissão foi concedida, reiniciar rastreamento
          setState((prev) => ({ ...prev, needsPermission: false }));
          await startLocationTracking();
        }

        // Verificar se GPS foi ativado
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (isEnabled && state.needsGpsEnabled) {
          // GPS foi ativado, reiniciar rastreamento
          setState((prev) => ({ ...prev, needsGpsEnabled: false }));
          await startLocationTracking();
        }
      }
    });

    // Cleanup ao desmontar ou quando token mudar
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, [token, enabled]);

  const initializeWebSocket = () => {
    setState((prev) => ({ ...prev, status: 'connecting' }));

    console.log('🔌 Conectando ao WebSocket:', API_BASE_URL);

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado! ID:', socket.id);
      setState((prev) => ({ ...prev, status: 'connected', error: null }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, status: 'disconnected' }));
    });

    socket.on('connect_error', (error) => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Erro ao conectar ao servidor',
      }));
    });

    socket.on('error', (error) => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Erro na conexão',
      }));
    });

    socket.on('reconnect', (attemptNumber) => {
      setState((prev) => ({ ...prev, status: 'connected', error: null }));
    });

    // Receber confirmação de atualização (opcional)
    socket.on('driver:location:updated', (data) => {
      setState((prev) => ({ ...prev, lastUpdate: new Date() }));
    });

    socketRef.current = socket;
  };

  const startLocationTracking = async () => {
    try {
      // Verificar permissão atual
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('🔐 Permissão:', currentStatus);

      // Se não tiver permissão, solicitar
      if (currentStatus !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();

        if (requestStatus !== 'granted') {
          setState((prev) => ({
            ...prev,
            status: 'permission_denied',
            error: 'Permissão de localização negada',
            needsPermission: true,
          }));
          return;
        }
      }

      // Verificar se os serviços de localização estão habilitados
      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log('📡 Serviços de localização habilitados:', isEnabled);

      if (!isEnabled) {
        console.error('❌ Serviços de localização desabilitados no dispositivo');
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'GPS desativado',
          needsGpsEnabled: true,
        }));
        return;
      }

      // Permissão concedida
      setState((prev) => ({
        ...prev,
        needsPermission: false,
        error: null,
      }));

      console.log('📍 Iniciando rastreamento de localização...');

      // Função para obter e enviar localização
      const getAndSendLocation = async () => {
        try {
          console.log('📍 Buscando localização atual...');

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High, // Alta precisão GPS (5-10m)
          });

          console.log('✅ Localização obtida:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });

          sendLocationToServer(location);
        } catch (error) {
          console.error('❌ Erro ao obter localização:', error);
        }
      };

      // Enviar localização imediatamente
      await getAndSendLocation();

      // Configurar intervalo para enviar a cada 10 segundos
      intervalRef.current = setInterval(async () => {
        await getAndSendLocation();
      }, 10000); // 10 segundos

      console.log('✅ Rastreamento iniciado (envio a cada 10 segundos)');
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Erro ao obter localização',
      }));
    }
  };

  const sendLocationToServer = (location: Location.LocationObject) => {
    if (!socketRef.current || !token) {
      console.log('❌ Não pode enviar: socket ou token ausente');
      return;
    }

    const locationData = {
      token,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    console.log('📤 Enviando localização para servidor:', {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: location.coords.accuracy,
      tokenPreview: token.substring(0, 20) + '...',
    });

    socketRef.current.emit(
      'driver:location:update',
      locationData,
      (response: any) => {
        console.log('📡 Resposta do servidor:', response);

        if (response?.success) {
          console.log('✅ Localização salva com sucesso!');
          setState((prev) => ({ ...prev, lastUpdate: new Date(), error: null }));
        } else {
          console.error('❌ Erro do servidor:', response?.error);
          setState((prev) => ({
            ...prev,
            error: response?.error || 'Erro ao enviar localização',
          }));
        }
      }
    );
  };

  const cleanup = () => {
    // Resetar flag de inicialização
    isInitializedRef.current = false;

    // Limpar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🧹 Intervalo de localização limpo');
    }

    // Desconectar socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState({
      status: 'disconnected',
      lastUpdate: null,
      error: null,
      needsPermission: false,
      needsGpsEnabled: false,
    });
  };

  // Função para solicitar permissão ou abrir configurações
  const requestPermission = async () => {
    try {
      // Verificar status atual da permissão
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        // Já tem permissão, só iniciar rastreamento
        await startLocationTracking();
        return;
      }

      if (!canAskAgain) {
        // Usuário negou permanentemente, abrir configurações
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
        } else {
          await Linking.openSettings();
        }
      } else {
        // Pode perguntar de novo
        await startLocationTracking();
      }
    } catch (error) {
      // Tentar abrir configurações como fallback
      await Linking.openSettings();
    }
  };

  // Função para abrir configurações de localização/GPS
  const openLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('❌ Erro ao abrir configurações:', error);
    }
  };

  return {
    ...state,
    requestPermission,
    openLocationSettings,
  };
}
