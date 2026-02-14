import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor, useAnimatedProps } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface AppTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function AppTextField({ label, icon, error, rightIcon, onRightIconPress, value, onFocus, onBlur, ...props }: AppTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const hasValue = !!value && value.length > 0;
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused || hasValue ? 1 : 0, { duration: 200 });
  }, [isFocused, hasValue]);

  const labelStyle = useAnimatedStyle(() => ({
    top: focusAnim.value * -10 + 18,
    fontSize: 16 - focusAnim.value * 4,
    opacity: 0.5 + focusAnim.value * 0.5,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: error ? Colors.error : isFocused ? Colors.primary : Colors.greyLight,
    backgroundColor: isFocused ? Colors.primaryGlow2 : Colors.surface,
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <AnimatedView style={[styles.container, containerStyle]}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={20}
              color={isFocused ? Colors.primary : Colors.textTertiary}
              style={styles.icon}
            />
          )}
          <View style={styles.inputWrapper}>
            <Animated.Text
              style={[
                styles.label,
                labelStyle,
                { color: error ? Colors.error : isFocused ? Colors.primary : Colors.textTertiary },
              ]}
            >
              {label}
            </Animated.Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
              onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
              placeholderTextColor={Colors.textTertiary}
              selectionColor={Colors.primary}
              {...props}
            />
          </View>
          {rightIcon && (
            <Pressable onPress={onRightIconPress} hitSlop={10}>
              <MaterialIcons name={rightIcon} size={22} color={Colors.textTertiary} />
            </Pressable>
          )}
        </AnimatedView>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  container: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontFamily: 'BeVietnamPro_400Regular',
  },
  input: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textPrimary,
    paddingTop: 10,
    height: '100%',
  },
  error: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: 'BeVietnamPro_400Regular',
    marginTop: 6,
    marginLeft: 16,
  },
});
