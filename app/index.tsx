import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth, UserRole } from '@/contexts/AuthContext';

function RoleCard({ icon, title, subtitle, selected, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        style={[styles.roleCard, selected && styles.roleCardSelected]}
      >
        <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
          <MaterialIcons name={icon} size={32} color={selected ? Colors.white : Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, platformType } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);

  // Redirecionar automaticamente se o usuário já estiver logado
  useEffect(() => {
    if (!isLoading && isAuthenticated && platformType) {
      const targetRoute = platformType === 'assistance' ? '/dashboard' : '/inspector-dashboard';
      router.replace(targetRoute);
    }
  }, [isLoading, isAuthenticated, platformType]);

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]} style={styles.splashScreen}>
        <Image source={require('@/assets/images/icon.png')} style={styles.splashLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color={Colors.white} style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  if (isAuthenticated) return null;

  const handleContinue = () => {
    if (!selectedRole) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedRole === 'guincheiro') {
      router.push('/login-guincheiro');
    } else {
      router.push('/login-vistoriador');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: topInset + 24 }]}
      >
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>SOS e Vistoria</Text>
      </LinearGradient>

      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <Text style={styles.title}>Como deseja acessar?</Text>
        <Text style={styles.subtitle}>Selecione seu perfil de acesso</Text>

        <View style={styles.cardsContainer}>
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <RoleCard
              icon="local-shipping"
              title="Guincheiro"
              subtitle="Gerenciar chamados de guincho e remoções"
              selected={selectedRole === 'guincheiro'}
              onPress={() => setSelectedRole('guincheiro')}
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <RoleCard
              icon="assignment"
              title="Vistoriador"
              subtitle="Realizar vistorias e perícias veiculares"
              selected={selectedRole === 'vistoriador'}
              onPress={() => setSelectedRole('vistoriador')}
            />
          </Animated.View>
        </View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedRole}
          style={({ pressed }) => [styles.continueBtn, !selectedRole && styles.continueBtnDisabled, pressed && selectedRole && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={selectedRole ? [Colors.primary, Colors.primaryLight] : [Colors.disabled, Colors.disabled]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            <Text style={[styles.continueBtnText, !selectedRole && { color: Colors.textTertiary }]}>Continuar</Text>
            <MaterialIcons name="arrow-forward" size={20} color={selectedRole ? Colors.white : Colors.textTertiary} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  splashScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 120, height: 120, borderRadius: 28 },
  headerGradient: {
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { width: 80, height: 80, borderRadius: 20 },
  appName: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.white,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: {
    fontSize: 26,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  cardsContainer: { gap: 14 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow2,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconSelected: {
    backgroundColor: Colors.primary,
  },
  roleTitle: {
    fontSize: 18,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  roleTitleSelected: {
    color: Colors.primary,
  },
  roleSubtitle: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.greyMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  continueBtn: {},
  continueBtnDisabled: {},
  continueBtnGradient: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.white,
  },
});
