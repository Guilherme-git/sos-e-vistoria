import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface AppDropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

export default function AppDropdown({ label, value, options, onSelect }: AppDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={() => { setOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Selecione'}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.textTertiary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.menu}>
            {options.map((item) => (
              <Pressable
                key={item}
                style={({ pressed }) => [
                  styles.option,
                  item === value && styles.selectedOption,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, item === value && styles.selectedText]}>{item}</Text>
                {item === value && <MaterialIcons name="check" size={20} color={Colors.primary} />}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  container: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.greyLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
  },
  pressed: {
    backgroundColor: Colors.primaryGlow2,
    borderColor: Colors.primary,
  },
  value: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    elevation: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  selectedOption: {
    backgroundColor: Colors.primaryGlow,
  },
  optionPressed: {
    backgroundColor: Colors.primaryGlow2,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textPrimary,
  },
  selectedText: {
    color: Colors.primary,
    fontFamily: 'BeVietnamPro_600SemiBold',
  },
});
