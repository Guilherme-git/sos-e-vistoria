import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking, FlatList, TextInput, Modal } from 'react-native';
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
import { useCalls } from '@/contexts/CallsContext';

const NAV_ITEMS = [
  { icon: 'info-outline' as const, label: 'Detalhes', key: 'info' },
  { icon: 'fact-check' as const, label: 'Vistoria', key: 'form' },
];

const TIMELINE_REBOQUE = [
  { label: 'Aguardando\nCheck-in', icon: 'pin-drop' as const },
  { label: 'Realizando\nCheck-in', icon: 'camera-alt' as const },
  { label: 'Aguardando\nCheck-out', icon: 'local-shipping' as const },
  { label: 'Realizando\nCheck-out', icon: 'assignment-turned-in' as const },
];

const PHOTO_TYPES = ['Frente', 'Lat. Esq.', 'Traseira', 'Lat. Dir.'];

function TimelineItem({ item, index, currentStep, total }: { item: typeof TIMELINE_REBOQUE[0]; index: number; currentStep: number; total: number }) {
  const isActive = index <= currentStep;
  const isCurrent = index === currentStep;
  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(300)} style={styles.timelineItem}>
      <View style={styles.timelineRowV}>
        {index > 0 && <View style={[styles.timelineLineV, { backgroundColor: isActive ? Colors.primary : Colors.greyLight }]} />}
        <View style={[styles.timelineCircle, isActive && styles.timelineCircleActive, isCurrent && styles.timelineCircleCurrent]}>
          <MaterialIcons name={item.icon} size={20} color={isActive ? Colors.white : Colors.textTertiary} />
        </View>
      </View>
      <View style={styles.timelineLabelContainer}>
        <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]} numberOfLines={2}>{item.label}</Text>
      </View>
    </Animated.View>
  );
}

function PhotoCard({ label, uri, onPress, index }: { label: string; uri?: string; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
      <Pressable
        style={({ pressed }) => [styles.photoCard, uri && styles.photoCardDone, pressed && { opacity: 0.85 }]}
        onPress={onPress}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialIcons name="camera-alt" size={24} color={Colors.textTertiary} />
            <Text style={styles.photoLabel}>{label}</Text>
          </View>
        )}
        {uri && (
          <View style={styles.photoCheck}>
            <MaterialIcons name="check" size={14} color={Colors.white} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function ActiveCallScreen() {
  const insets = useSafeAreaInsets();
  const { activeCall, updateActiveCall, completeCall } = useCalls();
  const [tabIndex, setTabIndex] = useState(0);
  const [inspectionType, setInspectionType] = useState<'checkin' | 'checkout'>('checkin');
  const [showCancel, setShowCancel] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!activeCall) {
    return (
      <View style={[styles.screen, { paddingTop: topInset }]}>
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Nenhum chamado ativo</Text>
          <AppButton label="Voltar" onPress={() => router.back()} variant="secondary" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const isReboque = activeCall.serviceType === 'Reboque';
  const currentPhotos = inspectionType === 'checkin' ? activeCall.checkinPhotos : activeCall.checkoutPhotos;
  const currentSignature = inspectionType === 'checkin' ? activeCall.checkinSignature : activeCall.checkoutSignature;

  const handleCall = () => Linking.openURL(`tel:${activeCall.phone.replace(/\D/g, '')}`);
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/55${activeCall.phone.replace(/\D/g, '')}`);
  const handleNavigate = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCall.pickupAddress)}`);

  const handleTakePhoto = (index: number) => {
    const photoType = index < PHOTO_TYPES.length ? PHOTO_TYPES[index] : `Foto ${index + 1}`;
    router.push({ pathname: '/camera', params: { photoType, inspectionType, photoIndex: index.toString() } });
  };

  const handleSignature = () => {
    router.push({ pathname: '/signature', params: { inspectionType } });
  };

  const handleProceed = () => {
    if (currentPhotos.length < 4 || !currentSignature) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowObservation(true);
  };

  const handleSubmitInspection = async () => {
    setShowObservation(false);
    setShowLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updates: any = {};
    if (inspectionType === 'checkin') {
      updates.checkinObservation = observation;
      updates.timelineStep = isReboque ? 2 : 1;
    } else {
      updates.checkoutObservation = observation;
      updates.timelineStep = isReboque ? 3 : 1;
    }
    await updateActiveCall(updates);
    await new Promise(r => setTimeout(r, 1200));
    setShowLoading(false);
    if (inspectionType === 'checkin' && isReboque) {
      setInspectionType('checkout');
      setObservation('');
    } else {
      setShowSuccess(true);
    }
  };

  const handleFinish = async () => {
    setShowSuccess(false);
    await completeCall();
    router.replace('/dashboard');
  };

  const handleCancelCall = async () => {
    setShowCancel(false);
    await completeCall();
    router.replace('/dashboard');
  };

  const photosDone = currentPhotos.filter(Boolean).length;
  const totalRequired = 4;
  const canSubmit = photosDone >= totalRequired && !!currentSignature;

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        {tabIndex === 0 && (
          <ScrollView style={styles.tabContent} contentContainerStyle={[styles.scrollContent, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                  <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </Pressable>
                <Text style={styles.topBarTitle}>Chamado Ativo</Text>
                <View style={{ width: 20 }} />
              </View>

              <View style={styles.clientCard}>
                <View style={styles.clientAvatarWrap}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    style={styles.clientAvatar}
                  >
                    <MaterialIcons name="person" size={28} color={Colors.white} />
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{activeCall.clientName}</Text>
                  <Text style={styles.vehicleDesc}>{activeCall.vehicleModel} {activeCall.vehicleColor} {activeCall.vehicleYear}</Text>
                </View>
                <View style={styles.serviceChip}>
                  <Text style={styles.serviceChipText}>{activeCall.serviceType}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="badge" size={18} color={Colors.textTertiary} />
                  <Text style={styles.infoLabel}>CPF/CNPJ</Text>
                  <Text style={styles.infoValue}>{activeCall.cpfCnpj}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-car" size={18} color={Colors.textTertiary} />
                  <Text style={styles.infoLabel}>Placa</Text>
                  <Text style={styles.infoValue}>{activeCall.plate}</Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <MaterialIcons name="phone" size={18} color={Colors.textTertiary} />
                  <Text style={styles.contactPhone}>{activeCall.phone}</Text>
                </View>
                <View style={styles.contactActions}>
                  <Pressable onPress={handleWhatsApp} style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }]}>
                    <MaterialIcons name="chat" size={20} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={handleCall} style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }]}>
                    <MaterialIcons name="phone" size={20} color={Colors.primary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.addressCard}>
                <MaterialIcons name="location-on" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>Endereço de coleta</Text>
                  <Text style={styles.addressValue}>{activeCall.pickupAddress}</Text>
                </View>
              </View>

              {isReboque && activeCall.destinationAddress && (
                <View style={styles.addressCard}>
                  <MaterialIcons name="flag" size={20} color={Colors.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLabel}>Endereço de destino</Text>
                    <Text style={styles.addressValue}>{activeCall.destinationAddress}</Text>
                  </View>
                </View>
              )}

              <View style={styles.quickActions}>
                <Pressable onPress={handleNavigate} style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.quickBtnGradient}>
                    <MaterialIcons name="near-me" size={20} color={Colors.white} />
                    <Text style={styles.quickBtnText}>Navegar</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={handleCall} style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}>
                  <View style={styles.quickBtnOutline}>
                    <MaterialIcons name="headset-mic" size={20} color={Colors.primary} />
                    <Text style={[styles.quickBtnText, { color: Colors.primary }]}>Atendente</Text>
                  </View>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Progresso</Text>
              <View style={styles.timelineContainer}>
                {(isReboque ? TIMELINE_REBOQUE : TIMELINE_REBOQUE.slice(0, 2)).map((item, i) => (
                  <TimelineItem key={i} item={item} index={i} currentStep={activeCall.timelineStep} total={isReboque ? 4 : 2} />
                ))}
              </View>

              <Pressable
                onPress={() => setShowCancel(true)}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
              >
                <MaterialIcons name="close" size={18} color={Colors.error} />
                <Text style={styles.cancelText}>Cancelar atendimento</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}

        {tabIndex === 1 && (
          <ScrollView style={styles.tabContent} contentContainerStyle={[styles.scrollContent, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={styles.topBar}>
                <Pressable onPress={() => setTabIndex(0)} hitSlop={12}>
                  <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </Pressable>
                <Text style={styles.topBarTitle}>
                  {inspectionType === 'checkin' ? 'Vistoria de Coleta' : 'Vistoria Final'}
                </Text>
                <View style={{ width: 20 }} />
              </View>

              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[styles.progressFill, { width: `${((canSubmit ? 3 : photosDone >= 4 ? 2 : photosDone > 0 ? 1 : 0) / 3) * 100}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{canSubmit ? 3 : photosDone >= 4 ? 2 : photosDone > 0 ? 1 : 0}/3 etapas</Text>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <View style={[styles.stepBadge, photosDone >= 4 && styles.stepBadgeDone]}>
                    {photosDone >= 4 ? <MaterialIcons name="check" size={16} color={Colors.white} /> : <Text style={styles.stepNumber}>1</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stepTitleRow}>
                      <Text style={styles.stepLabel}>Fotos do Veículo</Text>
                      <Text style={styles.required}>obrigatório</Text>
                    </View>
                    <Text style={styles.stepDesc}>Tire as 4 fotos obrigatórias do veículo</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
                  {PHOTO_TYPES.map((type, i) => (
                    <PhotoCard key={type} label={type} uri={currentPhotos[i]} onPress={() => handleTakePhoto(i)} index={i} />
                  ))}
                  <PhotoCard
                    label="Mais"
                    onPress={() => handleTakePhoto(currentPhotos.length)}
                    index={PHOTO_TYPES.length}
                  />
                </ScrollView>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepLabel}>Pertences</Text>
                    <Text style={styles.stepDesc}>Fotografe pertences dentro do veículo (opcional)</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
                  {activeCall.belongingsPhotos.map((uri, i) => (
                    <PhotoCard key={`b-${i}`} label={`${i + 1}`} uri={uri} onPress={() => {}} index={i} />
                  ))}
                  <PhotoCard
                    label="Adicionar"
                    onPress={() => {
                      router.push({ pathname: '/camera', params: { photoType: 'Pertences', inspectionType: 'belongings', photoIndex: activeCall.belongingsPhotos.length.toString() } });
                    }}
                    index={activeCall.belongingsPhotos.length}
                  />
                </ScrollView>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <View style={[styles.stepBadge, currentSignature && styles.stepBadgeDone]}>
                    {currentSignature ? <MaterialIcons name="check" size={16} color={Colors.white} /> : <Text style={styles.stepNumber}>3</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stepTitleRow}>
                      <Text style={styles.stepLabel}>Assinatura</Text>
                      <Text style={styles.required}>obrigatório</Text>
                    </View>
                    <Text style={styles.stepDesc}>Colete a assinatura do responsável</Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleSignature}
                  style={({ pressed }) => [styles.signatureBtn, currentSignature && styles.signatureBtnDone, pressed && { opacity: 0.85 }]}
                >
                  {currentSignature ? (
                    <View style={styles.signatureDone}>
                      <MaterialIcons name="check-circle" size={24} color={Colors.success} />
                      <Text style={styles.signatureDoneText}>Assinatura coletada</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialIcons name="draw" size={24} color={Colors.textTertiary} />
                      <Text style={styles.signaturePlaceholder}>Toque para assinar</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <AppButton
                label="Enviar vistoria"
                onPress={handleProceed}
                disabled={!canSubmit}
                icon="send"
                style={{ marginTop: 8, marginBottom: 24 }}
              />
            </Animated.View>
          </ScrollView>
        )}
      </View>

      <BottomNav items={NAV_ITEMS} activeIndex={tabIndex} onPress={setTabIndex} />

      <Modal visible={showObservation} transparent animationType="slide" onRequestClose={() => setShowObservation(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowObservation(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Observação</Text>
            <Text style={styles.sheetSubtitle}>Deseja adicionar alguma observação?</Text>
            <TextInput
              style={styles.observationInput}
              placeholder="Ex: Veículo com arranhão na porta esquerda..."
              placeholderTextColor={Colors.textTertiary}
              value={observation}
              onChangeText={setObservation}
              multiline
              maxLength={500}
              numberOfLines={4}
              textAlignVertical="top"
            />
            <AppButton
              label={observation.trim() ? 'Enviar com observação' : 'Enviar sem observação'}
              variant={observation.trim() ? 'primary' : 'secondary'}
              onPress={handleSubmitInspection}
              icon="send"
              style={{ marginTop: 16 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <AppDialog visible={showCancel} onClose={() => setShowCancel(false)} type="confirm" title="Cancelar atendimento?" message="Essa ação não pode ser desfeita." buttons={[
        { label: 'Não', onPress: () => setShowCancel(false), variant: 'outline' },
        { label: 'Sim, cancelar', onPress: handleCancelCall, variant: 'error' },
      ]} />
      <AppDialog visible={showSuccess} onClose={handleFinish} type="success" title="Concluído!" message="Vistoria enviada com sucesso." buttons={[{ label: 'Voltar ao início', onPress: handleFinish }]} />
      <AppDialog visible={showLoading} onClose={() => {}} type="loading" loadingText="Enviando..." />
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  topBarTitle: { fontSize: 18, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 14,
  },
  clientAvatarWrap: {},
  clientAvatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 17, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  vehicleDesc: { fontSize: 13, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 1 },
  serviceChip: { backgroundColor: Colors.primaryGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  serviceChipText: { fontSize: 12, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.primary },
  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoItem: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 4,
  },
  infoLabel: { fontSize: 11, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactPhone: { fontSize: 15, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textPrimary },
  contactActions: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  addressCard: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  addressLabel: { fontSize: 11, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  addressValue: { fontSize: 14, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textPrimary, marginTop: 2, lineHeight: 20 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: { flex: 1 },
  quickBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14 },
  quickBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary },
  quickBtnText: { fontSize: 14, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.white },
  sectionTitle: { fontSize: 18, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary, marginBottom: 14 },
  timelineContainer: { gap: 0, marginBottom: 24 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 56 },
  timelineRowV: { alignItems: 'center', width: 40 },
  timelineLineV: { width: 2, height: 16, borderRadius: 1 },
  timelineCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.greyLight, justifyContent: 'center', alignItems: 'center' },
  timelineCircleActive: { backgroundColor: Colors.primary },
  timelineCircleCurrent: { borderWidth: 2, borderColor: Colors.primaryLight },
  timelineLabelContainer: { flex: 1, justifyContent: 'center', paddingTop: 8 },
  timelineLabel: { fontSize: 13, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, lineHeight: 18 },
  timelineLabelActive: { color: Colors.textPrimary, fontFamily: 'BeVietnamPro_600SemiBold' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(213, 26, 24, 0.06)', marginBottom: 16 },
  cancelText: { fontSize: 14, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.error },
  progressBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.greyLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  progressText: { fontSize: 13, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textSecondary },
  stepCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 14 },
  stepCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.greyLight, justifyContent: 'center', alignItems: 'center' },
  stepBadgeDone: { backgroundColor: Colors.success },
  stepNumber: { fontSize: 14, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textSecondary },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepLabel: { fontSize: 16, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  required: { fontSize: 11, fontFamily: 'BeVietnamPro_500Medium', color: Colors.error, backgroundColor: 'rgba(213, 26, 24, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stepDesc: { fontSize: 13, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  photoList: { gap: 10, paddingTop: 4 },
  photoCard: { width: 80, height: 80, borderRadius: 14, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.greyLight },
  photoCardDone: { borderColor: Colors.success },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', gap: 4 },
  photoLabel: { fontSize: 10, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, textAlign: 'center' },
  photoCheck: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },
  signatureBtn: { height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.greyLight, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.background },
  signatureBtnDone: { borderColor: Colors.success, borderStyle: 'solid', backgroundColor: Colors.successLight },
  signatureDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signatureDoneText: { fontSize: 14, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.success },
  signaturePlaceholder: { fontSize: 14, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary },
  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.greyLight, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  sheetSubtitle: { fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  observationInput: { borderWidth: 1.5, borderColor: Colors.greyLight, borderRadius: 14, padding: 16, fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textPrimary, minHeight: 100, backgroundColor: Colors.background },
});
