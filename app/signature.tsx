import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, PanResponder } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useCalls } from '@/contexts/CallsContext';
import AppDialog from '@/components/AppDialog';

export default function SignatureScreen() {
  const insets = useSafeAreaInsets();
  const { inspectionType } = useLocalSearchParams<{ inspectionType: string }>();
  const { updateActiveCall } = useCalls();
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths((prev) => [...prev, currentPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
    setCurrentPath('');
  };

  const handleSave = () => {
    if (paths.length === 0 && !currentPath) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSave = async (confirmed: boolean) => {
    setShowConfirm(false);
    if (!confirmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">${paths.map(p => `<path d="${p}" stroke="black" stroke-width="3" fill="none"/>`).join('')}</svg>`;
    const uri = `data:image/svg+xml;base64,${btoa(svgData)}`;
    if (inspectionType === 'checkin') {
      await updateActiveCall({ checkinSignature: uri });
    } else {
      await updateActiveCall({ checkoutSignature: uri });
    }
    router.back();
  };

  const hasContent = paths.length > 0 || !!currentPath;

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Assinatura</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons name="refresh" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, styles.saveBtn, !hasContent && styles.saveBtnDisabled, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="check" size={22} color={hasContent ? Colors.white : Colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      <Animated.View entering={FadeIn.duration(300)} style={styles.canvasWrapper}>
        <Text style={styles.canvasLabel}>Peça para o responsável assinar abaixo</Text>
        <View style={styles.canvasContainer} {...panResponder.panHandlers}>
          <Svg style={styles.canvas}>
            {paths.map((p, i) => (
              <Path key={i} d={p} stroke={Colors.textPrimary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPath ? (
              <Path d={currentPath} stroke={Colors.textPrimary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </Svg>
          {!hasContent && (
            <View style={styles.hintContainer} pointerEvents="none">
              <MaterialIcons name="draw" size={32} color={Colors.greyMedium} />
              <Text style={styles.hintText}>Desenhe aqui</Text>
            </View>
          )}
          <View style={styles.signatureLine} />
        </View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <Text style={styles.footerText}>Assinatura do responsável pelo veículo</Text>
      </View>

      <AppDialog
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        type="confirm"
        title="Confirmar assinatura"
        message="Você declara ter visto todas as fotos de pertences?"
        buttons={[
          { label: 'Não', onPress: () => confirmSave(false), variant: 'outline' },
          { label: 'Sim, confirmar', onPress: () => confirmSave(true) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.greyLight,
  },
  title: {
    fontSize: 18,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  canvasWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  canvasLabel: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.greyLight,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hintContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.greyMedium,
  },
  signatureLine: {
    position: 'absolute',
    bottom: '25%',
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: Colors.greyLight,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textTertiary,
  },
});
