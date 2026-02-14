import { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface NavItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  key: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeIndex: number;
  onPress: (index: number) => void;
}

const SPRING_CONFIG = { damping: 16, stiffness: 200, mass: 0.8 };

function NavButton({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(isActive ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => {
    const bgOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      backgroundColor: `rgba(0, 126, 94, ${bgOpacity * 0.1})`,
      borderRadius: 16,
      paddingHorizontal: interpolate(progress.value, [0, 1], [16, 24]),
      paddingVertical: interpolate(progress.value, [0, 1], [8, 10]),
      transform: [{ scale: pressScale.value }],
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.15, 1.05]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.55, 0.8, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
    ],
    color: isActive ? Colors.primary : Colors.textTertiary,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, 20]),
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
    marginTop: 3,
    opacity: progress.value,
    transform: [
      { scaleX: interpolate(progress.value, [0, 0.7, 1], [0, 0.5, 1]) },
    ],
  }));

  return (
    <Pressable
      onPressIn={() => {
        pressScale.value = withSpring(0.9, { damping: 12 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 12 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[styles.navButton, containerStyle]}>
        <Animated.View style={iconStyle}>
          <MaterialIcons
            name={icon}
            size={24}
            color={isActive ? Colors.primary : Colors.textTertiary}
          />
        </Animated.View>
        <Animated.Text style={[styles.navLabel, labelStyle]}>
          {label}
        </Animated.Text>
        <Animated.View style={dotStyle} />
      </Animated.View>
    </Pressable>
  );
}

export default function BottomNav({ items, activeIndex, onPress }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.inner}>
        {items.map((item, i) => (
          <NavButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            isActive={i === activeIndex}
            onPress={() => onPress(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
    paddingTop: 8,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro_600SemiBold',
    letterSpacing: 0.3,
  },
});
