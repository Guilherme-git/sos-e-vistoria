import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import BottomNav from '@/components/BottomNav';
import AppButton from '@/components/AppButton';
import AppDialog from '@/components/AppDialog';
import Colors from '@/constants/colors';
import { useInspection, InspectionPhoto, PhotoStatus } from '@/contexts/InspectionContext';

const STATUS_COLORS: Record<PhotoStatus, { bg: string; text: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  pending: { bg: Colors.greyLight, text: Colors.textTertiary, icon: 'radio-button-unchecked' },
  validating: { bg: 'rgba(243, 156, 17, 0.1)', text: '#F39C11', icon: 'schedule' },
  approved: { bg: Colors.successLight, text: Colors.success, icon: 'check-circle' },
  error: { bg: 'rgba(244, 67, 54, 0.1)', text: '#F44336', icon: 'error' },
};

const STATUS_LABELS: Record<PhotoStatus, string> = {
  pending: 'Pendente',
  validating: 'Em validação',
  approved: 'Aprovado',
  error: 'Erro',
};

function PhotoCaptureCard({
  photo,
  index,
  onCapture,
  inspectionType,
}: {
  photo: InspectionPhoto;
  index: number;
  onCapture: () => void;
  inspectionType: 'primary' | 'secondary';
}) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_COLORS[photo.status];
  const hasPhoto = !!photo.uri;

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.captureCard, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.captureHeader}>
          <View style={[styles.captureStatus, { backgroundColor: status.bg }]}>
            <MaterialIcons name={status.icon} size={18} color={status.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.captureLabel}>{photo.label}</Text>
            <Text style={[styles.captureStatusText, { color: status.text }]}>{STATUS_LABELS[photo.status]}</Text>
          </View>
          {hasPhoto && (
            <Image source={{ uri: photo.uri }} style={styles.captureThumb} contentFit="cover" />
          )}
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={Colors.textTertiary} />
        </View>

        {expanded && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.captureBody}>
            {hasPhoto ? (
              <View style={styles.capturePreview}>
                <Image source={{ uri: photo.uri }} style={styles.capturePreviewImage} contentFit="cover" />
                <View style={styles.capturePreviewActions}>
                  <Pressable
                    onPress={onCapture}
                    style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.8 }]}
                  >
                    <MaterialIcons name="refresh" size={18} color={Colors.primary} />
                    <Text style={styles.retakeBtnText}>Refazer</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={onCapture}
                style={({ pressed }) => [styles.captureAction, pressed && { opacity: 0.85 }]}
              >
                <MaterialIcons name="camera-alt" size={28} color={Colors.primary} />
                <Text style={styles.captureActionText}>Tirar foto</Text>
              </Pressable>
            )}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color={Colors.textTertiary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function InspectorCallScreen() {
  const insets = useSafeAreaInsets();
  const { activeInspection, updatePrimaryPhoto, updateSecondaryPhoto, completeInspection, updateActiveInspection } = useInspection();
  const [tabIndex, setTabIndex] = useState(0);
  const [showCancel, setShowCancel] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!activeInspection) {
    return (
      <View style={[styles.screen, { paddingTop: topInset }]}>
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Nenhuma vistoria ativa</Text>
          <AppButton label="Voltar" onPress={() => router.back()} variant="secondary" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const primaryDone = activeInspection.primaryPhotos.filter(p => !!p.uri).length;
  const primaryTotal = activeInspection.primaryPhotos.length;
  const secondaryDone = activeInspection.secondaryPhotos.filter(p => !!p.uri).length;
  const secondaryTotal = activeInspection.secondaryPhotos.length;

  const primaryColor = primaryDone === primaryTotal ? Colors.success : primaryDone > 0 ? '#F39C11' : Colors.textTertiary;
  const secondaryColor = secondaryDone === secondaryTotal ? Colors.success : secondaryDone > 0 ? '#F39C11' : Colors.textTertiary;

  const NAV_ITEMS = [
    { icon: 'info-outline' as const, label: 'Informações', key: 'info' },
    { icon: 'assignment' as const, label: 'Primária', key: 'primary' },
    ...(activeInspection.hasSecondaryVehicle ? [{ icon: 'person-outline' as const, label: 'Secundária', key: 'secondary' }] : []),
  ];

  const handleCapturePhoto = (type: 'primary' | 'secondary', index: number) => {
    router.push({
      pathname: '/inspector-camera',
      params: { inspectionType: type, photoIndex: index.toString(), photoLabel: type === 'primary' ? activeInspection.primaryPhotos[index].label : activeInspection.secondaryPhotos[index].label },
    });
  };

  const handleSubmit = async () => {
    if (primaryDone < primaryTotal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(r => setTimeout(r, 1500));
    setShowLoading(false);
    setShowSuccess(true);
  };

  const handleFinish = async () => {
    setShowSuccess(false);
    await completeInspection();
    router.replace('/inspector-dashboard');
  };

  const handleCancelCall = async () => {
    setShowCancel(false);
    await completeInspection();
    router.replace('/inspector-dashboard');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        {tabIndex === 0 && (
          <ScrollView style={styles.tabContent} contentContainerStyle={[styles.scrollContent, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.topTitle}>Informações da Vistoria</Text>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBg}>
                    <MaterialIcons name="directions-car" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Veículo Principal</Text>
                </View>
                <InfoRow icon="directions-car" label="Modelo" value={`${activeInspection.vehicleBrand} ${activeInspection.vehicleModel}`} />
                <InfoRow icon="palette" label="Cor" value={activeInspection.vehicleColor} />
                <InfoRow icon="event" label="Ano" value={activeInspection.vehicleYear} />
                <InfoRow icon="confirmation-number" label="Placa" value={activeInspection.plate} />
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBg}>
                    <MaterialIcons name="person" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Associado</Text>
                </View>
                <InfoRow icon="person" label="Nome" value={activeInspection.associateName} />
                <InfoRow icon="badge" label="CPF" value={activeInspection.associateCpf} />
                <InfoRow icon="phone" label="Telefone" value={activeInspection.associatePhone} />
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBg}>
                    <MaterialIcons name="report" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Ocorrência</Text>
                </View>
                <InfoRow icon="warning" label="Tipo" value={activeInspection.occurrenceType} />
                <InfoRow icon="location-on" label="Endereço" value={activeInspection.occurrenceAddress} />
                <InfoRow icon="event" label="Data" value={new Date(activeInspection.occurrenceDate).toLocaleDateString('pt-BR')} />
              </View>

              {activeInspection.hasSecondaryVehicle && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(255, 163, 0, 0.1)' }]}>
                      <MaterialIcons name="directions-car" size={20} color={Colors.secondary} />
                    </View>
                    <Text style={styles.sectionTitle}>Veículo Secundário</Text>
                  </View>
                  <InfoRow icon="directions-car" label="Modelo" value={activeInspection.secondaryVehicleModel || '--'} />
                  <InfoRow icon="confirmation-number" label="Placa" value={activeInspection.secondaryVehiclePlate || '--'} />
                </View>
              )}

              <View style={styles.statusSection}>
                <Text style={styles.statusSectionTitle}>Status da Vistoria</Text>
                <View style={styles.statusItem}>
                  <MaterialIcons name={primaryDone === primaryTotal ? 'check-circle' : 'radio-button-unchecked'} size={20} color={primaryColor} />
                  <Text style={[styles.statusItemText, { color: primaryColor }]}>Vistoria Primária ({primaryDone}/{primaryTotal})</Text>
                </View>
                {activeInspection.hasSecondaryVehicle && (
                  <View style={styles.statusItem}>
                    <MaterialIcons name={secondaryDone === secondaryTotal ? 'check-circle' : 'radio-button-unchecked'} size={20} color={secondaryColor} />
                    <Text style={[styles.statusItemText, { color: secondaryColor }]}>Vistoria Secundária ({secondaryDone}/{secondaryTotal})</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => setShowCancel(true)}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
              >
                <MaterialIcons name="close" size={18} color={Colors.error} />
                <Text style={styles.cancelText}>Cancelar vistoria</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}

        {tabIndex === 1 && (
          <ScrollView style={styles.tabContent} contentContainerStyle={[styles.scrollContent, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.topTitle}>Vistoria Primária</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(primaryDone / primaryTotal) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{primaryDone}/{primaryTotal}</Text>
              </View>

              <View style={styles.captureList}>
                {activeInspection.primaryPhotos.map((photo, i) => (
                  <PhotoCaptureCard
                    key={`p-${i}`}
                    photo={photo}
                    index={i}
                    onCapture={() => handleCapturePhoto('primary', i)}
                    inspectionType="primary"
                  />
                ))}
              </View>

              <View style={styles.extraSection}>
                <Text style={styles.extraTitle}>Mídia adicional</Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/inspector-camera', params: { inspectionType: 'primary', photoIndex: '-1', photoLabel: 'Vídeo da rua', isVideo: 'true' } })}
                  style={({ pressed }) => [styles.extraCard, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.extraIcon, { backgroundColor: 'rgba(30, 136, 229, 0.1)' }]}>
                    <MaterialIcons name="videocam" size={22} color="#1E88E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.extraLabel}>Vídeo da rua</Text>
                    <Text style={styles.extraDesc}>Grave um vídeo do local</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={Colors.textTertiary} />
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  style={({ pressed }) => [styles.extraCard, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.extraIcon, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                    <MaterialIcons name="mic" size={22} color="#F44336" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.extraLabel}>Depoimento em áudio</Text>
                    <Text style={styles.extraDesc}>Grave o depoimento</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={Colors.textTertiary} />
                </Pressable>
              </View>

              <AppButton
                label="Finalizar vistoria"
                onPress={handleSubmit}
                disabled={primaryDone < primaryTotal}
                icon="send"
                style={{ marginTop: 8, marginBottom: 24 }}
              />
            </Animated.View>
          </ScrollView>
        )}

        {tabIndex === 2 && activeInspection.hasSecondaryVehicle && (
          <ScrollView style={styles.tabContent} contentContainerStyle={[styles.scrollContent, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.topTitle}>Vistoria Secundária</Text>
              <Text style={styles.vehicleInfo}>
                {activeInspection.secondaryVehicleModel} - {activeInspection.secondaryVehiclePlate}
              </Text>
              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(secondaryDone / secondaryTotal) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{secondaryDone}/{secondaryTotal}</Text>
              </View>

              <View style={styles.captureList}>
                {activeInspection.secondaryPhotos.map((photo, i) => (
                  <PhotoCaptureCard
                    key={`s-${i}`}
                    photo={photo}
                    index={i}
                    onCapture={() => handleCapturePhoto('secondary', i)}
                    inspectionType="secondary"
                  />
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        )}
      </View>

      <BottomNav items={NAV_ITEMS} activeIndex={tabIndex} onPress={setTabIndex} />

      <AppDialog visible={showCancel} onClose={() => setShowCancel(false)} type="confirm" title="Cancelar vistoria?" message="Todas as fotos e dados serão perdidos." buttons={[
        { label: 'Não', onPress: () => setShowCancel(false), variant: 'outline' },
        { label: 'Sim, cancelar', onPress: handleCancelCall, variant: 'error' },
      ]} />
      <AppDialog visible={showSuccess} onClose={handleFinish} type="success" title="Vistoria concluída!" message="Todos os dados foram enviados com sucesso." buttons={[{ label: 'Voltar ao início', onPress: handleFinish }]} />
      <AppDialog visible={showLoading} onClose={() => {}} type="loading" loadingText="Enviando vistoria..." />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  tabContent: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textSecondary },
  topTitle: { fontSize: 22, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, paddingVertical: 14 },
  vehicleInfo: { fontSize: 14, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textSecondary, marginBottom: 12 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sectionIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  infoLabel: { fontSize: 11, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textPrimary, marginTop: 1 },
  statusSection: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 14 },
  statusSectionTitle: { fontSize: 16, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  statusItemText: { fontSize: 14, fontFamily: 'BeVietnamPro_500Medium' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(213, 26, 24, 0.06)', marginBottom: 24 },
  cancelText: { fontSize: 14, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.error },
  progressBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.greyLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  progressText: { fontSize: 13, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textSecondary },
  captureList: { gap: 8 },
  captureCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  captureHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  captureStatus: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  captureLabel: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  captureStatusText: { fontSize: 12, fontFamily: 'BeVietnamPro_400Regular', marginTop: 1 },
  captureThumb: { width: 40, height: 40, borderRadius: 8 },
  captureBody: { paddingHorizontal: 14, paddingBottom: 14 },
  capturePreview: { gap: 10 },
  capturePreviewImage: { width: '100%', height: 160, borderRadius: 12 },
  capturePreviewActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primaryGlow },
  retakeBtnText: { fontSize: 13, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.primary },
  captureAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  captureActionText: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.primary },
  extraSection: { marginTop: 20, gap: 8 },
  extraTitle: { fontSize: 16, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  extraCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
  },
  extraIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  extraLabel: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  extraDesc: { fontSize: 12, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 1 },
});
