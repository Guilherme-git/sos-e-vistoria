import { useEffect, useRef } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';

/**
 * Custom hook para tocar som de notificação
 * Toca o som 1 vez quando recebe um novo chamado
 */
export function useNotificationSound() {
  // Caminho do arquivo de som (na raiz do projeto)
  const audioSource: AudioSource = require('../toque-notificacao.mp3');

  const player = useAudioPlayer(audioSource, {
    // Configurações do player
    shouldPlay: false,
  });

  /**
   * Toca o som de notificação 1 vez
   */
  const playNotificationSound = () => {
    try {
      player.seekTo(0); // Voltar ao início
      player.play();
      console.log('🔊 Tocando notificação');
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  };

  return { playNotificationSound };
}
