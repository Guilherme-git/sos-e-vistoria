import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, SlideInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, interpolate } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CallData {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  deliveryAddress?: string;
  distance: string;
  estimatedTime: string;
  serviceType: string;
  vehiclePlate?: string;
}

interface IncomingCallModalProps {
  visible: boolean;
  callData: CallData | null;
  onAccept: () => void;
  onReject: () => void;
  timeout?: number;
}

const TIMER_SIZE = 72;
const TIMER_STROKE = 4;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

function TimerRing({ timeLeft, total, isUrgent }: { timeLeft: number; total: number; isUrgent: boolean }) {
  const progress = timeLeft / total;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progress);

  return (
    <View style={timerStyles.container}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={TIMER_STROKE}
          fill="none"
        />
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke={isUrgent ? '#FF6B6B' : Colors.white}
          strokeWidth={TIMER_STROKE}
          fill="none"
          strokeDasharray={`${TIMER_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={timerStyles.textContainer}>
        <Text style={[timerStyles.number, isUrgent && { color: '#FF6B6B' }]}>{timeLeft}</Text>
        <Text style={timerStyles.label}>seg</Text>
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: { width: TIMER_SIZE, height: TIMER_SIZE, justifyContent: 'center', alignItems: 'center' },
  textContainer: { position: 'absolute', alignItems: 'center' },
  number: { fontSize: 26, fontFamily: 'BeVietnamPro_700Bold', color: Colors.white, lineHeight: 30 },
  label: { fontSize: 10, fontFamily: 'BeVietnamPro_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: -2 },
});

function RoutePoint({ color, label, address, isLast }: { color: string; label: string; address: string; isLast?: boolean }) {
  return (
    <View style={routeStyles.row}>
      <View style={routeStyles.dotColumn}>
        <View style={[routeStyles.dot, { backgroundColor: color }]} />
        {!isLast && <View style={routeStyles.line} />}
      </View>
      <View style={routeStyles.content}>
        <Text style={routeStyles.label}>{label}</Text>
        <Text style={routeStyles.address} numberOfLines={2}>{address}</Text>
      </View>
    </View>
  );
}

const routeStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  dotColumn: { alignItems: 'center', paddingTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, backgroundColor: Colors.divider, marginVertical: 4, minHeight: 20 },
  content: { flex: 1, paddingBottom: 16 },
  label: { fontSize: 11, fontFamily: 'BeVietnamPro_600SemiBold', color: Colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  address: { fontSize: 15, fontFamily: 'BeVietnamPro_500Medium', color: Colors.textPrimary, lineHeight: 21 },
});

export default function IncomingCallModal({
  visible,
  callData,
  onAccept,
  onReject,
  timeout = 15,
}: IncomingCallModalProps) {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(timeout);
  const pulseScale = useSharedValue(1);

  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);

  useEffect(() => {
    if (visible) {
      setTimeLeft(timeout);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, timeout]);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeLeft]);

  const acceptPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible || !callData) return null;

  const isUrgent = timeLeft <= 5;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View entering={SlideInDown.springify().damping(18).stiffness(140)} style={[styles.sheet, { paddingBottom: bottomInset }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.typeBadge}>
                <MaterialIcons name="local-shipping" size={16} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Novo Chamado</Text>
                <Text style={styles.serviceType}>{callData.serviceType}</Text>
              </View>
            </View>
            <TimerRing timeLeft={timeLeft} total={timeout} isUrgent={isUrgent} />
          </View>

          <Animated.View entering={FadeIn.delay(150).duration(300)} style={styles.statsBar}>
            <View style={styles.statItem}>
              <MaterialIcons name="straighten" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{callData.distance}</Text>
              <Text style={styles.statLabel}>Distância</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{callData.estimatedTime}</Text>
              <Text style={styles.statLabel}>Tempo est.</Text>
            </View>
            {callData.vehiclePlate && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="directions-car" size={18} color={Colors.primary} />
                  <Text style={styles.statValue}>{callData.vehiclePlate}</Text>
                  <Text style={styles.statLabel}>Placa</Text>
                </View>
              </>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).duration(300)} style={styles.routeSection}>
            <RoutePoint color={Colors.primary} label="Origem" address={callData.pickupAddress} isLast={!callData.deliveryAddress} />
            {callData.deliveryAddress && (
              <RoutePoint color={Colors.error} label="Destino" address={callData.deliveryAddress} isLast />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350).duration(300)} style={styles.actions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onReject();
              }}
              style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
            >
              <MaterialIcons name="close" size={26} color={Colors.textSecondary} />
            </Pressable>

            <Pressable
              onPressIn={() => { pulseScale.value = withSpring(0.95, { damping: 12 }); }}
              onPressOut={() => { pulseScale.value = withSpring(1, { damping: 12 }); }}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAccept();
              }}
              style={({ pressed }) => [pressed && { opacity: 0.95 }]}
            >
              <Animated.View style={[styles.acceptBtn, acceptPulse]}>
                <MaterialIcons name="check" size={24} color={Colors.white} />
                <Text style={styles.acceptText}>Aceitar Chamado</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.greyMedium,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  serviceType: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.divider,
  },
  routeSection: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  rejectBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.greyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  acceptText: {
    fontSize: 17,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.white,
  },
});
