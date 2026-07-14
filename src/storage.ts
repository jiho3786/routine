import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppData,
  CompletionRecord,
  Routine,
  RoutineSchedule,
  Session,
  Settings,
  UserTemplate,
} from './types';

const STORAGE_KEY = 'routine_timer_v1';

export const defaultSettings: Settings = {
  soundEnabled: true,
  hapticEnabled: true,
};

export const defaultSchedule = (): RoutineSchedule => ({
  enabled: false,
  hour: 7,
  minute: 0,
  weekdays: [1, 2, 3, 4, 5],
});

function migrateRoutine(raw: Partial<Routine>): Routine {
  return {
    id: raw.id!,
    name: raw.name ?? '새 루틴',
    color: raw.color ?? '#007AFF',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    steps: raw.steps ?? [],
    repeatCount: raw.repeatCount ?? 1,
    schedule: raw.schedule
      ? {
          enabled: raw.schedule.enabled ?? false,
          hour: raw.schedule.hour ?? 7,
          minute: raw.schedule.minute ?? 0,
          weekdays: raw.schedule.weekdays ?? [1, 2, 3, 4, 5],
        }
      : defaultSchedule(),
  };
}

function migrateSession(raw: Partial<Session>): Session {
  return {
    id: raw.id!,
    routineId: raw.routineId!,
    routineSnapshot: migrateRoutine(raw.routineSnapshot ?? { id: raw.routineId }),
    status: raw.status!,
    currentStepIndex: raw.currentStepIndex ?? 0,
    remainingSec: raw.remainingSec ?? 0,
    startedAt: raw.startedAt ?? new Date().toISOString(),
    endedAt: raw.endedAt,
    pauseStartedAt: raw.pauseStartedAt,
    repeatCount: raw.repeatCount ?? raw.routineSnapshot?.repeatCount ?? 1,
    currentRepeat: raw.currentRepeat ?? 1,
  };
}

function migrateUserTemplate(raw: Partial<UserTemplate>): UserTemplate {
  return {
    id: raw.id!,
    name: raw.name ?? '새 템플릿',
    description: raw.description ?? '',
    color: raw.color ?? '#1D1D1F',
    icon: raw.icon ?? 'bookmark-outline',
    repeatCount: raw.repeatCount ?? 1,
    steps: (raw.steps ?? []).map((step, index) => ({
      ...step,
      order: step.order ?? index,
    })),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

/** 테스트용 export */
export const __test = { migrateRoutine, migrateSession, migrateUserTemplate };

export const emptyAppData: AppData = {
  routines: [],
  session: null,
  settings: defaultSettings,
  completions: [],
  customTemplates: [],
};

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      routines: (parsed.routines ?? []).map((r) => migrateRoutine(r)),
      session: parsed.session ? migrateSession(parsed.session) : null,
      settings: { ...defaultSettings, ...parsed.settings },
      completions: (parsed.completions ?? []) as CompletionRecord[],
      customTemplates: (parsed.customTemplates ?? []).map((t) => migrateUserTemplate(t)),
    };
  } catch {
    return emptyAppData;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
