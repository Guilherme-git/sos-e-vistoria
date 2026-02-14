import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useInspection } from '@/contexts/InspectionContext';

export default function InspectorCameraScreen() {
  const insets = useSafeAreaInsets();
  const { inspectionType, photoIndex, photoLabel } = useLocalSearchParams<{
    inspectionType: string;
    photoIndex: string;
    photoLabel: string;
  }>();
  const { updatePrimaryPhoto, updateSecondaryPhoto } = useInspection();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);
  const index = parseInt(photoIndex || '0', 10);

  const savePhoto = async (uri: string) => {
    const photo = { uri, status: 'validating' as const, label: photoLabel || '' };
    if (inspectionType === 'primary') {
      await updatePrimaryPhoto(index, photo);
    } else if (inspectionType === 'secondary') {
      await updateSecondaryPhoto(index, photo);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => router.back(), 600);
  };

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      await savePhoto(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      await savePhoto(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.title}>{photoLabel || 'Foto'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.instructionBar}>
        <MaterialIcons name="info-outline" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.instructionText}>Posicione a câmera para capturar a {photoLabel?.toLowerCase()}</Text>
      </View>

      <View style={styles.previewArea}>
        {capturedUri ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.capturedContainer}>
            <Image source={{ uri: capturedUri }} style={styles.capturedImage} contentFit="contain" />
            <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.successOverlay}>
              <View style={styles.successBadge}>
                <MaterialIcons name="check" size={32} color={Colors.white} />
              </View>
              <Text style={styles.successText}>Foto salva</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderFrame}>
              <MaterialIcons name="camera-alt" size={56} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.placeholderText}>Capture ou selecione uma foto</Text>
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: bottomInset }]}>
        <Pressable onPress={handleGallery} style={({ pressed }) => [styles.galleryBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="photo-library" size={26} color={Colors.white} />
          <Text style={styles.galleryLabel}>Galeria</Text>
        </Pressable>

        <Pressable onPress={handleCapture} style={({ pressed }) => [styles.captureBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
          <View style={styles.captureRing}>
            <View style={styles.captureInner} />
          </View>
        </Pressable>

        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1B16' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.white },
  instructionBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  instructionText: { fontSize: 13, fontFamily: 'BeVietnamPro_400Regular', color: 'rgba(255,255,255,0.7)', flex: 1 },
  previewArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, marginTop: 12, borderRadius: 24, overflow: 'hidden' },
  placeholder: { alignItems: 'center', gap: 20 },
  placeholderFrame: {
    width: 120, height: 120, borderRadius: 24, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderText: { fontSize: 15, fontFamily: 'BeVietnamPro_400Regular', color: 'rgba(255,255,255,0.5)' },
  capturedContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  capturedImage: { width: '100%', height: '100%', borderRadius: 24 },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(13, 27, 22, 0.5)', gap: 12,
  },
  successBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },
  successText: { fontSize: 18, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.white },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 24, paddingHorizontal: 24 },
  galleryBtn: { width: 60, alignItems: 'center', gap: 4 },
  galleryLabel: { fontSize: 11, fontFamily: 'BeVietnamPro_400Regular', color: 'rgba(255,255,255,0.6)' },
  captureBtn: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center' },
  captureRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white },
});
