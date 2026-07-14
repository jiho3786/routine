import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Routine } from './types';

const STEP_END_ID = 'step-end-current';
const ROUTINE_REMINDER_PREFIX = 'routine-reminder-';

/** Android Expo Go에서는 expo-notifications import 시 즉시 크래시 → 비활성화 */
export function isNotificationsSupported(): boolean {
  const inExpoGo = Constants.appOwnership === 'expo';
  if (inExpoGo && Platform.OS === 'android') return false;
  return Platform.OS !== 'web';
}

export function routineReminderId(routineId: string, weekday: number): string {
  return `${ROUTINE_REMINDER_PREFIX}${routineId}-${weekday}`;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const Notifications = await import('expo-notifications');
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function cancelStepNotification() {
  if (!isNotificationsSupported()) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(STEP_END_ID);
  } catch {
    // ignore
  }
}

/** @deprecated 세션 단계 알림만 취소합니다. 루틴 예약 알림은 유지됩니다. */
export async function cancelScheduledNotifications() {
  await cancelStepNotification();
}

export async function scheduleStepEndNotification(params: {
  secondsFromNow: number;
  stepTitle: string;
  nextTitle?: string;
  isLast: boolean;
}) {
  if (!isNotificationsSupported()) return;

  const { secondsFromNow, stepTitle, nextTitle, isLast } = params;
  if (secondsFromNow < 1) return;

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await cancelStepNotification();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('routine-timer', {
        name: '루틴 타이머',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const body = isLast
      ? `"${stepTitle}" 단계가 끝났습니다. 루틴을 완료했어요!`
      : `"${stepTitle}" 끝. 다음: ${nextTitle ?? '다음 단계'}`;

    await Notifications.scheduleNotificationAsync({
      identifier: STEP_END_ID,
      content: {
        title: isLast ? '루틴 완료' : '다음 단계',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(secondsFromNow)),
        ...(Platform.OS === 'android' ? { channelId: 'routine-timer' } : {}),
      },
    });
  } catch {
    // Expo Go 제한 등
  }
}

export async function syncRoutineReminders(routines: Routine[]) {
  if (!isNotificationsSupported()) return;

  try {
    const Notifications = await import('expo-notifications');
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('routine-reminders', {
        name: '루틴 예약 알림',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(ROUTINE_REMINDER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    for (const routine of routines) {
      if (!routine.schedule?.enabled || routine.steps.length === 0) continue;
      for (const jsWeekday of routine.schedule.weekdays) {
        await Notifications.scheduleNotificationAsync({
          identifier: routineReminderId(routine.id, jsWeekday),
          content: {
            title: '루틴 알림',
            body: `"${routine.name}" 루틴을 시작할 시간이에요.`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: jsWeekday + 1,
            hour: routine.schedule.hour,
            minute: routine.schedule.minute,
            ...(Platform.OS === 'android' ? { channelId: 'routine-reminders' } : {}),
          },
        });
      }
    }
  } catch {
    // ignore
  }
}
