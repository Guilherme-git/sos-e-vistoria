import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

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
  timeout?: number; // Tempo em segundos para aceitar (padrão: 15s)
}

export default function IncomingCallModal({
  visible,
  callData,
  onAccept,
  onReject,
  timeout = 15,
}: IncomingCallModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeout);

  useEffect(() => {
    if (visible) {
      // Resetar timer
      setTimeLeft(timeout);

      // Vibração suave (2x curta)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);

      // Timer de contagem regressiva
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // NÃO auto-rejeitar - apenas parar em 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, timeout]);

  if (!visible || !callData) return null;

  const progress = (timeLeft / timeout) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View entering={SlideInDown.springify().damping(15)} style={styles.container}>
          {/* Header com timer */}
          <View style={[styles.header, isUrgent && styles.headerUrgent]}>
            <Animated.View entering={ZoomIn.delay(200)} style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </Animated.View>
            <Text style={styles.headerTitle}>Novo Chamado</Text>
            <Text style={styles.headerSubtitle}>Aceite antes que expire!</Text>
          </View>

          {/* Barra de progresso */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }, isUrgent && styles.progressUrgent]} />
          </View>

          {/* Informações do chamado */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.content}>
            {/* Endereço de coleta */}
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={24} color={Colors.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Origem</Text>
                <Text style={styles.infoValue}>{callData.pickupAddress}</Text>
              </View>
            </View>

            {/* Endereço de entrega */}
            {callData.deliveryAddress && (
              <View style={styles.infoRow}>
                <MaterialIcons name="flag" size={24} color={Colors.error} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Destino</Text>
                  <Text style={styles.infoValue}>{callData.deliveryAddress}</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Botões */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onReject();
              }}
            >
              <MaterialIcons name="close" size={24} color={Colors.white} />
              <Text style={styles.rejectText}>Recusar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9 }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAccept();
              }}
            >
              <MaterialIcons name="check" size={28} color={Colors.white} />
              <Text style={styles.acceptText}>Aceitar Chamado</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  headerUrgent: {
    backgroundColor: Colors.error,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 28,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro_400Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.greyLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  progressUrgent: {
    backgroundColor: Colors.error,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plateContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginTop: 8,
  },
  plateLabel: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro_500Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  plateValue: {
    fontSize: 24,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectText: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: Colors.white,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro_700Bold',
    color: Colors.white,
  },
});
