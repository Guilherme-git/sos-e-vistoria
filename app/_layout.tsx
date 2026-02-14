import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { CallsProvider } from '@/contexts/CallsContext';
import { InspectionProvider } from '@/contexts/InspectionContext';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import Colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login-guincheiro" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="login-vistoriador" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="active-call" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="signature" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="inspector-dashboard" />
      <Stack.Screen name="inspector-call" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="inspector-camera" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <CallsProvider>
                <InspectionProvider>
                  <RootLayoutNav />
                </InspectionProvider>
              </CallsProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
