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
import AppDialog from '@/components/AppDialog';
import Colors from '@/constants/colors';
import { maskCPF, isValidCPF } from '@/lib/masks';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginGuincheiroScreen() {
  const insets = useSafeAreaInsets();
  const { loginGuincheiro } = useAuth();
  const [step, setStep] = useState(0);
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleCpfChange = (text: string) => {
    setCpf(maskCPF(text));
    setErrors((e) => ({ ...e, cpf: '' }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setErrors((e) => ({ ...e, password: '' }));
  };

  const validateStep0 = () => {
    if (!cpf.trim()) {
      setErrors({ cpf: 'Campo obrigatório' });
      return false;
    }
    if (!isValidCPF(cpf)) {
      setErrors({ cpf: 'CPF inválido' });
      return false;
    }
    return true;
  };

  const validateStep1 = () => {
    if (!password.trim()) {
      setErrors({ password: 'Campo obrigatório' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 0 && validateStep0()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(1);
    } else if (step === 1 && validateStep1()) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      // Fazer login na API
      await loginGuincheiro(cpf, password);

      // Sucesso - vibrar e redirecionar
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/dashboard');
    } catch (error: any) {
      // Erro - mostrar mensagem
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Tratar diferentes tipos de erro
      let message = 'Erro ao fazer login. Tente novamente.';

      if (error.response) {
        // Erro da API (status code 4xx ou 5xx)
        const status = error.response.status;
        const apiError = error.response.data?.error;

        if (status === 401 || status === 403) {
          message = apiError || 'CPF ou senha inválidos.';
        } else if (status >= 500) {
          message = 'Erro no servidor. Tente novamente mais tarde.';
        } else {
          message = apiError || 'Erro ao fazer login. Verifique seus dados.';
        }
      } else if (error.request) {
        // Erro de rede (sem resposta do servidor)
        message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
      } else if (error.message && !error.message.includes('axios')) {
        // Outros erros (sem detalhes técnicos)
        message = error.message;
      }

      setErrorMessage(message);
      setShowErrorDialog(true);

      // Voltar para o passo 0 em caso de erro
      setStep(0);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    } else {
      router.back();
    }
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
            <Text style={styles.welcomeTitle}>Guincheiro</Text>
            <Text style={styles.welcomeSubtitle}>Faça login para continuar</Text>
            <View style={styles.formSection}>
              <AppTextField
                label="CPF"
                icon="badge"
                value={cpf}
                onChangeText={handleCpfChange}
                keyboardType="numeric"
                error={errors.cpf}
                autoFocus
              />
              <AppButton
                label="Continuar"
                onPress={handleNext}
                loading={loading}
                icon="arrow-forward"
              />
              <Pressable onPress={() => setShowInfoDialog(true)} style={styles.registerLink}>
                <Text style={styles.registerText}>Ainda não tem conta? </Text>
                <Text style={styles.registerHighlight}>Cadastre-se</Text>
              </Pressable>
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
            <Text style={styles.stepHint}>Digite sua senha para acessar o aplicativo.</Text>
            <View style={styles.formSection}>
              <AppTextField
                label="Senha"
                icon="lock"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                error={errors.password}
                autoFocus
              />
              <AppButton
                label="Entrar"
                onPress={handleNext}
                loading={loading}
                icon="check"
              />
            </View>
          </Animated.View>
        )}
      </KeyboardAwareScrollViewCompat>

      <AppDialog
        visible={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        type="confirm"
        title="Cadastro"
        message="Para se cadastrar, entre em contato com a central Utiliza SOS para obter suas credenciais de acesso."
        buttons={[{ label: 'Entendi', onPress: () => setShowInfoDialog(false) }]}
      />

      <AppDialog
        visible={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        type="error"
        title="Erro ao fazer login"
        message={errorMessage}
        buttons={[{ label: 'Tentar novamente', onPress: () => setShowErrorDialog(false), variant: 'error' }]}
      />
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
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary },
  registerHighlight: { fontSize: 14, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.primary },
});
