import { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, Pressable, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import AppTextField from '@/components/AppTextField';
import AppButton from '@/components/AppButton';
import Colors from '@/constants/colors';
import { maskCPF, isValidCPF } from '@/lib/masks';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginVistoriadorScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const validateStep0 = () => {
    if (!cpf.trim()) { setErrors({ cpf: 'Campo obrigatório' }); return false; }
    if (!isValidCPF(cpf)) { setErrors({ cpf: 'CPF inválido' }); return false; }
    return true;
  };

  const validateStep1 = () => {
    if (!password.trim()) { setErrors({ password: 'Campo obrigatório' }); return false; }
    return true;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 0 && validateStep0()) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStep(1); }
    else if (step === 1 && validateStep1()) { handleLogin(); }
  };

  const handleLogin = async () => {
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(r => setTimeout(r, 800));
    await login({
      cnpjCpf: cpf,
      cpf: cpf.replace(/\D/g, ''),
      name: 'Vistoriador',
      phone: '',
      company: 'SOS e Vistoria',
      role: 'vistoriador',
    });
    setLoading(false);
    router.replace('/inspector-dashboard');
  };

  const handleBack = () => {
    if (step > 0) { setStep(step - 1); setErrors({}); }
    else router.back();
  };

  const stepIndicators = [0, 1];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: topInset + 16 }]}
      >
        <Pressable onPress={handleBack} style={[styles.backButton, { top: topInset + 16 }]} hitSlop={12}>
          <MaterialIcons name="arrow-back-ios" size={20} color={Colors.white} />
        </Pressable>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.stepIndicators}>
          {stepIndicators.map((s) => (
            <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]} />
          ))}
        </View>
      </LinearGradient>

      <KeyboardAwareScrollViewCompat style={styles.content} contentContainerStyle={styles.contentInner} bottomOffset={20}>
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(300)} key="step0">
            <Text style={styles.welcomeTitle}>Vistoriador</Text>
            <Text style={styles.welcomeSubtitle}>Insira seu CPF para acessar</Text>
            <View style={styles.formSection}>
              <AppTextField
                label="CPF"
                icon="badge"
                value={cpf}
                onChangeText={(t) => { setCpf(maskCPF(t)); setErrors({}); }}
                keyboardType="numeric"
                error={errors.cpf}
              />
              <AppButton label="Entrar" onPress={handleNext} loading={loading} icon="arrow-forward" />
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={SlideInRight.duration(300)} key="step1">
            <View style={styles.lockSection}>
              <View style={styles.lockIconBg}>
                <MaterialIcons name="lock-outline" size={36} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.stepTitle}>Insira sua senha</Text>
            <Text style={styles.stepHint}>
              Caso não tenha uma senha definida, insira os 6 primeiros dígitos do seu CPF.
            </Text>
            <View style={styles.formSection}>
              <AppTextField
                label="Senha"
                icon="lock"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors({}); }}
                secureTextEntry
                error={errors.password}
              />
              <AppButton label="Entrar" onPress={handleNext} loading={loading} icon="login" />
            </View>
          </Animated.View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingBottom: 24, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backButton: { position: 'absolute', left: 20, zIndex: 10 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  stepIndicators: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  stepDotActive: { width: 24, backgroundColor: Colors.white },
  stepDotDone: { backgroundColor: 'rgba(255,255,255,0.7)' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  welcomeTitle: { fontSize: 28, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  welcomeSubtitle: { fontSize: 15, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginBottom: 28 },
  formSection: { gap: 4 },
  lockSection: { alignItems: 'center', marginBottom: 20 },
  lockIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 24, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  stepHint: { fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },
});
