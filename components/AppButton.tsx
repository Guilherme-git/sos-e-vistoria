import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'error' | 'secondary' | 'ghost' | 'outline';
  icon?: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AppButton({ label, onPress, variant = 'primary', icon, loading, disabled, small, style, textStyle }: AppButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const configs: Record<string, { bg: string; text: string; border?: string }> = {
    primary: { bg: Colors.primary, text: Colors.white },
    error: { bg: Colors.error, text: Colors.white },
    secondary: { bg: Colors.primaryGlow, text: Colors.primary },
    ghost: { bg: 'transparent', text: Colors.primary },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
  };
  const cfg = configs[variant];

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
      style={[
        styles.button,
        small && styles.small,
        {
          backgroundColor: disabled ? Colors.disabled : cfg.bg,
          borderColor: cfg.border || 'transparent',
          borderWidth: cfg.border ? 1.5 : 0,
        },
        animStyle,
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={cfg.text} size="small" />
      ) : (
        <>
          {icon && <MaterialIcons name={icon} size={small ? 18 : 20} color={disabled ? Colors.textTertiary : cfg.text} style={label ? { marginRight: 8 } : undefined} />}
          {label ? <Text style={[styles.label, small && styles.smallLabel, { color: disabled ? Colors.textTertiary : cfg.text }, textStyle]}>{label}</Text> : null}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  small: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_600SemiBold',
    letterSpacing: 0.2,
  },
  smallLabel: {
    fontSize: 13,
  },
});
