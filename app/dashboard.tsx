import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import BottomNav from '@/components/BottomNav';
import AppButton from '@/components/AppButton';
import AppDialog from '@/components/AppDialog';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCalls, CallRecord } from '@/contexts/CallsContext';
import * as Crypto from 'expo-crypto';

const NAV_ITEMS = [
  { icon: 'receipt-long' as const, label: 'Chamados', key: 'calls' },
  { icon: 'person-outline' as const, label: 'Perfil', key: 'profile' },
];

function CallCard({ call, index }: { call: CallRecord; index: number }) {
  const date = new Date(call.createdAt);
  const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(350)}>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
        <View style={styles.cardIcon}>
          <MaterialIcons name="check-circle" size={22} color={Colors.success} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>#{call.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.cardDate}>{formatted}</Text>
          </View>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{call.pickupAddress}</Text>
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>{call.serviceType}</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { driver, logout, updatePhoto } = useAuth();
  const { completedCalls, setActiveCall } = useCalls();
  const [tabIndex, setTabIndex] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    router.replace('/');
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

  const handleSimulateCall = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newCall: CallRecord = {
      id: Crypto.randomUUID(),
      clientName: 'João Silva',
      vehicleModel: 'Honda Civic',
      vehicleColor: 'Prata',
      vehicleYear: '2022',
      plate: 'ABC-1D34',
      serviceType: 'Reboque',
      cpfCnpj: '123.456.789-00',
      phone: '(11) 99999-0000',
      pickupAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      destinationAddress: 'Rua Augusta, 500 - Consolação, São Paulo - SP',
      status: 'active',
      createdAt: new Date().toISOString(),
      timelineStep: 0,
      checkinPhotos: [],
      checkoutPhotos: [],
      belongingsPhotos: [],
    };
    await setActiveCall(newCall);
    router.push('/active-call');
  };

  const renderCallItem = useCallback(({ item, index }: { item: CallRecord; index: number }) => (
    <CallCard call={item} index={index} />
  ), []);

  return (
    <View style={styles.screen}>
      {tabIndex === 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.body, { paddingTop: topInset }]}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
                Olá, {driver?.name?.split(' ')[0] || 'Motorista'}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
                Seus chamados realizados
              </Text>
            </View>
            <Pressable onPress={handleSimulateCall} style={styles.newCallBtn}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newCallGradient}
              >
                <MaterialIcons name="add" size={24} color={Colors.white} />
              </LinearGradient>
            </Pressable>
          </View>

          {completedCalls.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{completedCalls.length}</Text>
                <Text style={styles.statLabel}>Concluídos</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.primaryGlow }]}>
                <Text style={[styles.statNumber, { color: Colors.primary }]}>0</Text>
                <Text style={styles.statLabel}>Pendentes</Text>
              </View>
            </Animated.View>
          )}

          {completedCalls.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="local-shipping" size={40} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum chamado ainda</Text>
              <Text style={styles.emptyText}>Toque no botão + para simular um novo chamado</Text>
            </View>
          ) : (
            <FlatList
              data={completedCalls}
              keyExtractor={(item) => item.id}
              renderItem={renderCallItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!!completedCalls.length}
            />
          )}
        </Animated.View>
      )}

      {tabIndex === 1 && (
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
            <Text style={styles.profileName}>{driver?.name || 'Motorista'}</Text>
            <Text style={styles.profileCompany}>{driver?.company || ''}</Text>
          </LinearGradient>

          <View style={styles.profileBody}>
            <ProfileItem icon="phone-iphone" label="Telefone" value={driver?.phone || '--'} />
            <ProfileItem icon="badge" label="Documento" value={driver?.cnpjCpf || '--'} />
            <ProfileItem icon="business" label="Empresa" value={driver?.company || '--'} />

            <Pressable
              onPress={() => setShowLogout(true)}
              style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="logout" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <BottomNav items={NAV_ITEMS} activeIndex={tabIndex} onPress={setTabIndex} />

      <AppDialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        type="confirm"
        title="Sair da conta?"
        message="Você precisará fazer login novamente para acessar o aplicativo."
        buttons={[
          { label: 'Cancelar', onPress: () => setShowLogout(false), variant: 'outline' },
          { label: 'Sair', onPress: handleLogout, variant: 'error' },
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
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  newCallBtn: {},
  newCallGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greyLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textTertiary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  cardChipText: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  profileGradient: {
    alignItems: 'center',
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  profileCompany: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileItemLabel: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  profileItemValue: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(213, 26, 24, 0.06)',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.error,
  },
});
