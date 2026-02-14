import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Switch, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import BottomNav from '@/components/BottomNav';
import AppButton from '@/components/AppButton';
import AppDialog from '@/components/AppDialog';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useInspection, getDefaultPrimaryPhotos, getDefaultSecondaryPhotos, InspectionRecord } from '@/contexts/InspectionContext';

const NAV_ITEMS = [
  { icon: 'two-wheeler' as const, label: 'Home', key: 'home' },
  { icon: 'attach-money' as const, label: 'Pagamentos', key: 'payments' },
  { icon: 'person-outline' as const, label: 'Perfil', key: 'profile' },
];

function ProfileItem({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.profileItem}>
      <View style={styles.profileItemIcon}>
        <MaterialIcons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value}</Text>
      </View>
    </View>
  );
}

function PaymentCard({ index }: { index: number }) {
  const isPaid = index < 2;
  const date = new Date();
  date.setDate(date.getDate() - index * 7);
  const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(300)}>
      <View style={styles.paymentCard}>
        <View style={[styles.paymentIcon, { backgroundColor: isPaid ? Colors.successLight : 'rgba(243, 156, 17, 0.1)' }]}>
          <MaterialIcons name={isPaid ? 'check-circle' : 'schedule'} size={22} color={isPaid ? Colors.success : '#F39C11'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.paymentTitle}>Vistoria #{(1000 + index).toString()}</Text>
          <Text style={styles.paymentDate}>{formatted}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.paymentAmount}>R$ {(150 + index * 25).toFixed(2)}</Text>
          <View style={[styles.paymentStatusBadge, { backgroundColor: isPaid ? Colors.successLight : 'rgba(243, 156, 17, 0.1)' }]}>
            <Text style={[styles.paymentStatusText, { color: isPaid ? Colors.success : '#F39C11' }]}>
              {isPaid ? 'Pago' : 'Pendente'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function InspectorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { driver, logout, updatePhoto } = useAuth();
  const { receivingCalls, setReceivingCalls, activeInspection, setActiveInspection, completedInspections } = useInspection();
  const [tabIndex, setTabIndex] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    router.replace('/');
  };

  const handleToggle = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setReceivingCalls(val);
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updatePhoto(result.assets[0].uri);
    }
  };

  const handleSimulateInspection = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newInspection: InspectionRecord = {
      id: Crypto.randomUUID(),
      associateName: 'Maria Oliveira',
      associateCpf: '987.654.321-00',
      associatePhone: '(11) 98888-7777',
      vehicleModel: 'Toyota Corolla',
      vehicleBrand: 'Toyota',
      vehicleColor: 'Branco',
      vehicleYear: '2023',
      plate: 'DEF-5G67',
      occurrenceType: 'Colisão',
      occurrenceAddress: 'Rua Oscar Freire, 1200 - Jardins, São Paulo - SP',
      occurrenceDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      receivingCalls: true,
      primaryPhotos: getDefaultPrimaryPhotos(),
      secondaryPhotos: getDefaultSecondaryPhotos(),
      hasSecondaryVehicle: true,
      secondaryVehicleModel: 'VW Golf',
      secondaryVehiclePlate: 'GHI-8J90',
    };
    await setActiveInspection(newInspection);
    router.push('/inspector-call');
  };

  return (
    <View style={styles.screen}>
      {tabIndex === 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.body, { paddingTop: topInset }]}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
                Olá, {driver?.name?.split(' ')[0] || 'Vistoriador'}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
                Painel de vistorias
              </Text>
            </View>
          </View>

          <View style={styles.toggleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>{receivingCalls ? 'Recebendo Chamados' : 'Chamados Desativados'}</Text>
              <Text style={styles.toggleSubtitle}>
                {receivingCalls ? 'Você receberá novos chamados de vistoria' : 'Ative para receber novos chamados'}
              </Text>
            </View>
            <Switch
              value={receivingCalls}
              onValueChange={handleToggle}
              trackColor={{ false: Colors.greyLight, true: Colors.primaryLight }}
              thumbColor={receivingCalls ? Colors.primary : Colors.greyMedium}
            />
          </View>

          {completedInspections.length > 0 && (
            <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{completedInspections.length}</Text>
                <Text style={styles.statLabel}>Concluídas</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.primaryGlow }]}>
                <Text style={[styles.statNumber, { color: Colors.primary }]}>{activeInspection ? 1 : 0}</Text>
                <Text style={styles.statLabel}>Ativas</Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="assignment" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {receivingCalls ? 'Aguardando chamados' : 'Nenhum Chamado'}
            </Text>
            <Text style={styles.emptyText}>
              {receivingCalls
                ? 'Fique atento, novos chamados chegarão em breve'
                : 'Não há chamados para exibir no momento'}
            </Text>
            <AppButton
              label="Simular Vistoria"
              onPress={handleSimulateInspection}
              icon="add"
              variant="secondary"
              style={{ marginTop: 20 }}
            />
          </View>
        </Animated.View>
      )}

      {tabIndex === 1 && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.body, { paddingTop: topInset }]}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">Pagamentos</Text>
              <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
                Histórico de pagamentos
              </Text>
            </View>
          </View>

          <FlatList
            data={[0, 1, 2, 3]}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item, index }) => <PaymentCard index={index} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="payments" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Sem pagamentos</Text>
                <Text style={styles.emptyText}>Seus pagamentos aparecerão aqui</Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {tabIndex === 2 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.body}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.profileGradient, { paddingTop: topInset + 24 }]}
          >
            <Pressable onPress={handlePickPhoto} style={styles.avatarContainer}>
              {driver?.photoUri ? (
                <Image source={{ uri: driver.photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={48} color={Colors.textTertiary} />
                </View>
              )}
              <View style={styles.cameraButton}>
                <MaterialIcons name="camera-alt" size={14} color={Colors.white} />
              </View>
            </Pressable>
            <Text style={styles.profileName}>{driver?.name || 'Vistoriador'}</Text>
            <View style={styles.roleBadge}>
              <MaterialIcons name="verified" size={14} color={Colors.white} />
              <Text style={styles.roleBadgeText}>Vistoriador</Text>
            </View>
          </LinearGradient>

          <ScrollView style={styles.profileBody} showsVerticalScrollIndicator={false}>
            <ProfileItem icon="badge" label="CPF" value={driver?.cnpjCpf || '--'} />
            <ProfileItem icon="business" label="Empresa" value={driver?.company || '--'} />
            <ProfileItem icon="assignment" label="Vistorias realizadas" value={completedInspections.length.toString()} />

            <Pressable
              onPress={() => setShowLogout(true)}
              style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="logout" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}

      <BottomNav items={NAV_ITEMS} activeIndex={tabIndex} onPress={setTabIndex} />

      <AppDialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        type="confirm"
        title="Sair da conta?"
        message="Você precisará fazer login novamente."
        buttons={[
          { label: 'Cancelar', onPress: () => setShowLogout(false), variant: 'outline' },
          { label: 'Sair', onPress: handleLogout, variant: 'error' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 12,
  },
  greeting: { fontSize: 24, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  headerSub: { fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 2 },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 20, marginHorizontal: 24, marginBottom: 16, gap: 16,
  },
  toggleTitle: { fontSize: 16, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  toggleSubtitle: { fontSize: 13, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 13, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greyLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  emptyText: { fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  listContent: { paddingHorizontal: 24, paddingBottom: 16 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 10, gap: 12,
  },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentTitle: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary },
  paymentDate: { fontSize: 12, fontFamily: 'BeVietnamPro_400Regular', color: Colors.textTertiary, marginTop: 2 },
  paymentAmount: { fontSize: 16, fontFamily: 'BeVietnamPro_700Bold', color: Colors.textPrimary },
  paymentStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  paymentStatusText: { fontSize: 11, fontFamily: 'BeVietnamPro_600SemiBold' },
  profileGradient: {
    alignItems: 'center', paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  cameraButton: {
    position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  profileName: { fontSize: 22, fontFamily: 'BeVietnamPro_700Bold', color: Colors.white, textTransform: 'capitalize' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  roleBadgeText: { fontSize: 13, fontFamily: 'BeVietnamPro_500Medium', color: Colors.white },
  profileBody: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  profileItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
  },
  profileItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  profileItemLabel: { fontSize: 12, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textTertiary, letterSpacing: 0.3, textTransform: 'uppercase' },
  profileItemValue: { fontSize: 16, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textPrimary, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, marginTop: 16, marginBottom: 32, borderRadius: 14,
    backgroundColor: 'rgba(213, 26, 24, 0.06)',
  },
  logoutText: { fontSize: 15, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.error },
});
