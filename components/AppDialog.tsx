import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface DialogButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'error' | 'outline';
}

interface AppDialogProps {
  visible: boolean;
  onClose: () => void;
  type?: 'confirm' | 'success' | 'error' | 'loading';
  title?: string;
  message?: string;
  buttons?: DialogButton[];
  loadingText?: string;
}

export default function AppDialog({ visible, onClose, type = 'confirm', title, message, buttons, loadingText }: AppDialogProps) {
  if (type === 'loading') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            {loadingText && <Text style={styles.loadingText}>{loadingText}</Text>}
          </Animated.View>
        </View>
      </Modal>
    );
  }

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'error' : undefined;
  const iconColor = type === 'success' ? Colors.success : type === 'error' ? Colors.error : Colors.primary;
  const iconBg = type === 'success' ? Colors.successLight : type === 'error' ? 'rgba(213, 26, 24, 0.1)' : Colors.primaryGlow;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.springify().damping(18)} style={styles.dialog}>
          {iconName && (
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <MaterialIcons name={iconName} size={40} color={iconColor} />
            </View>
          )}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttons}>
            {buttons?.map((btn, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.button,
                  btn.variant === 'outline'
                    ? styles.outlineBtn
                    : { backgroundColor: btn.variant === 'error' ? Colors.error : Colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={btn.onPress}
              >
                <Text style={[styles.btnText, btn.variant === 'outline' && { color: Colors.textSecondary }]}>
                  {btn.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.greyLight,
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.white,
  },
  loadingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textSecondary,
  },
});
