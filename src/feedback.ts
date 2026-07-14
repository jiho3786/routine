import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { Settings } from './types';

export async function playStepTransitionFeedback(settings: Settings) {
  if (settings.hapticEnabled) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore on unsupported platforms
    }
  }

  if (settings.soundEnabled && settings.hapticEnabled) {
    // Expo Go SDK 57에서 expo-av(ExponentAV) 네이티브 모듈이 없을 수 있어
    // 사운드 대신 추가 햅틱으로 피드백. 백그라운드 전환음은 알림에서 처리.
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
  } else if (settings.soundEnabled && Platform.OS === 'web') {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }
}

export async function playButtonHaptic(settings: Settings) {
  if (!settings.hapticEnabled) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // ignore
  }
}
