import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { playStepTransitionFeedback } from './feedback';
import {
  cancelScheduledNotifications,
  ensureNotificationPermission,
  scheduleStepEndNotification,
  syncRoutineReminders,
} from './notifications';
import { defaultSchedule, emptyAppData, loadAppData, saveAppData } from './storage';
import { ROUTINE_TEMPLATES } from './templates';
import { ROUTINE_COLORS } from './theme';
import type { AppData, CompletionRecord, Routine, Session, Settings, Step, UserTemplate } from './types';
import { createId } from './utils/id';
import { advanceSessionAfterStepEnd } from './utils/sessionAdvance';
import { routineTotalSec } from './utils/time';

type StoreContextValue = {
  ready: boolean;
  routines: Routine[];
  session: Session | null;
  settings: Settings;
  completions: CompletionRecord[];
  customTemplates: UserTemplate[];
  createRoutine: () => Promise<Routine>;
  createRoutineFromTemplate: (templateId: string) => Promise<Routine | null>;
  createCustomTemplate: () => Promise<UserTemplate>;
  saveRoutineAsTemplate: (routineId: string) => Promise<UserTemplate | null>;
  updateCustomTemplate: (template: UserTemplate) => Promise<void>;
  deleteCustomTemplate: (id: string) => Promise<void>;
  updateRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  duplicateRoutine: (id: string) => Promise<Routine | null>;
  reorderRoutines: (routines: Routine[]) => Promise<void>;
  reorderSteps: (routineId: string, steps: Step[]) => Promise<void>;
  upsertStep: (routineId: string, step: Step) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  startSession: (routineId: string) => Promise<Session | null>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  skipStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  stopSession: () => Promise<void>;
  clearCompletedSession: () => Promise<void>;
  tickRemaining: number | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function sortSteps(steps: Step[]): Step[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index }));
}

function cloneRoutine(routine: Routine, nameSuffix = ' 복사'): Routine {
  const now = new Date().toISOString();
  return {
    ...routine,
    id: createId('routine'),
    name: `${routine.name}${nameSuffix}`,
    updatedAt: now,
    steps: sortSteps(routine.steps).map((step, index) => ({
      ...step,
      id: createId('step'),
      order: index,
    })),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyAppData);
  const [ready, setReady] = useState(false);
  const [tickRemaining, setTickRemaining] = useState<number | null>(null);
  const dataRef = useRef(data);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const persist = useCallback(async (next: AppData) => {
    dataRef.current = next;
    setData(next);
    await saveAppData(next);
  }, []);

  const refreshReminders = useCallback(async (routines: Routine[]) => {
    await syncRoutineReminders(routines);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadAppData();
      if (!mounted) return;
      setData(loaded);
      dataRef.current = loaded;
      if (loaded.session?.status === 'running') {
        const remaining = loaded.session.remainingSec;
        endsAtRef.current = Date.now() + remaining * 1000;
        setTickRemaining(remaining);
      } else if (loaded.session?.status === 'paused') {
        setTickRemaining(loaded.session.remainingSec);
      }
      setReady(true);
      await refreshReminders(loaded.routines);
    })();
    return () => {
      mounted = false;
    };
  }, [refreshReminders]);

  const syncNotificationForSession = useCallback(async (session: Session | null) => {
    await cancelScheduledNotifications();
    if (!session || session.status !== 'running') return;
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    const steps = sortSteps(session.routineSnapshot.steps);
    const current = steps[session.currentStepIndex];
    if (!current) return;
    const next = steps[session.currentStepIndex + 1];
    const isLastStep = session.currentStepIndex >= steps.length - 1;
    const isLastRepeat = session.currentRepeat >= session.repeatCount;
    await scheduleStepEndNotification({
      secondsFromNow: session.remainingSec,
      stepTitle: current.title,
      nextTitle: next?.title,
      isLast: isLastStep && isLastRepeat,
    });
  }, []);

  const advanceOrComplete = useCallback(
    async (fromSession: Session) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      try {
        await playStepTransitionFeedback(dataRef.current.settings);
        const result = advanceSessionAfterStepEnd(fromSession);

        if (result.kind === 'completed') {
          const steps = sortSteps(fromSession.routineSnapshot.steps);
          const perRoundSec = routineTotalSec(steps);
          const record: CompletionRecord = {
            id: createId('completion'),
            routineId: fromSession.routineId,
            routineName: fromSession.routineSnapshot.name,
            completedAt: result.session.endedAt!,
            totalSec: perRoundSec * fromSession.repeatCount,
            repeatCount: fromSession.repeatCount,
          };
          endsAtRef.current = null;
          setTickRemaining(0);
          await persist({
            ...dataRef.current,
            session: result.session,
            completions: [record, ...dataRef.current.completions],
          });
          await cancelScheduledNotifications();
          return;
        }

        endsAtRef.current = Date.now() + result.session.remainingSec * 1000;
        setTickRemaining(result.session.remainingSec);
        await persist({ ...dataRef.current, session: result.session });
        await syncNotificationForSession(result.session);
      } finally {
        advancingRef.current = false;
      }
    },
    [persist, syncNotificationForSession]
  );

  const flushRemainingFromClock = useCallback(() => {
    const session = dataRef.current.session;
    if (!session || session.status !== 'running' || endsAtRef.current == null) {
      return session?.remainingSec ?? null;
    }
    const remaining = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
    return remaining;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const session = data.session;
    if (!session || session.status !== 'running') return;

    if (endsAtRef.current == null) {
      endsAtRef.current = Date.now() + session.remainingSec * 1000;
    }

    intervalRef.current = setInterval(() => {
      const remaining = flushRemainingFromClock();
      if (remaining == null) return;
      setTickRemaining(remaining);

      if (remaining <= 0) {
        const current = dataRef.current.session;
        if (current && current.status === 'running') {
          void advanceOrComplete({ ...current, remainingSec: 0 });
        }
      } else if (dataRef.current.session?.status === 'running') {
        const snapped = dataRef.current.session;
        if (snapped && Math.abs(snapped.remainingSec - remaining) >= 5) {
          void persist({
            ...dataRef.current,
            session: { ...snapped, remainingSec: remaining },
          });
        }
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ready, data.session?.id, data.session?.status, data.session?.currentStepIndex, advanceOrComplete, flushRemainingFromClock, persist]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      const session = dataRef.current.session;
      if (!session || session.status !== 'running') return;
      const remaining = flushRemainingFromClock();
      if (remaining == null) return;
      setTickRemaining(remaining);
      if (remaining <= 0) {
        void advanceOrComplete({ ...session, remainingSec: 0 });
      } else {
        void persist({
          ...dataRef.current,
          session: { ...session, remainingSec: remaining },
        });
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [advanceOrComplete, flushRemainingFromClock, persist]);

  const createRoutine = useCallback(async () => {
    const routine: Routine = {
      id: createId('routine'),
      name: '새 루틴',
      color: ROUTINE_COLORS[dataRef.current.routines.length % ROUTINE_COLORS.length],
      updatedAt: new Date().toISOString(),
      steps: [],
      repeatCount: 1,
      schedule: defaultSchedule(),
    };
    const next = {
      ...dataRef.current,
      routines: [routine, ...dataRef.current.routines],
    };
    await persist(next);
    await refreshReminders(next.routines);
    return routine;
  }, [persist, refreshReminders]);

  const createRoutineFromTemplate = useCallback(
    async (templateId: string) => {
      const custom = dataRef.current.customTemplates.find((t) => t.id === templateId);
      const builtin = ROUTINE_TEMPLATES.find((t) => t.id === templateId);
      const template = custom ?? builtin;
      if (!template) return null;
      const routine: Routine = {
        id: createId('routine'),
        name: template.name,
        color: template.color,
        updatedAt: new Date().toISOString(),
        repeatCount: template.repeatCount,
        schedule: defaultSchedule(),
        steps: template.steps.map((step, index) => ({
          id: createId('step'),
          title: step.title,
          durationSec: step.durationSec,
          order: index,
        })),
      };
      const next = {
        ...dataRef.current,
        routines: [routine, ...dataRef.current.routines],
      };
      await persist(next);
      await refreshReminders(next.routines);
      return routine;
    },
    [persist, refreshReminders]
  );

  const createCustomTemplate = useCallback(async () => {
    const template: UserTemplate = {
      id: createId('template'),
      name: '새 템플릿',
      description: '',
      color: ROUTINE_COLORS[dataRef.current.customTemplates.length % ROUTINE_COLORS.length],
      icon: 'bookmark-outline',
      repeatCount: 1,
      steps: [],
      updatedAt: new Date().toISOString(),
    };
    await persist({
      ...dataRef.current,
      customTemplates: [template, ...dataRef.current.customTemplates],
    });
    return template;
  }, [persist]);

  const saveRoutineAsTemplate = useCallback(
    async (routineId: string) => {
      const routine = dataRef.current.routines.find((r) => r.id === routineId);
      if (!routine) return null;
      const template: UserTemplate = {
        id: createId('template'),
        name: routine.name,
        description: `${routine.steps.length}단계 루틴`,
        color: routine.color,
        icon: 'bookmark-outline',
        repeatCount: Math.max(1, routine.repeatCount),
        steps: sortSteps(routine.steps).map((step, index) => ({
          ...step,
          id: createId('step'),
          order: index,
        })),
        updatedAt: new Date().toISOString(),
      };
      await persist({
        ...dataRef.current,
        customTemplates: [template, ...dataRef.current.customTemplates],
      });
      return template;
    },
    [persist]
  );

  const updateCustomTemplate = useCallback(
    async (template: UserTemplate) => {
      const next: UserTemplate = {
        ...template,
        steps: sortSteps(template.steps),
        updatedAt: new Date().toISOString(),
      };
      await persist({
        ...dataRef.current,
        customTemplates: dataRef.current.customTemplates.map((t) =>
          t.id === next.id ? next : t
        ),
      });
    },
    [persist]
  );

  const deleteCustomTemplate = useCallback(
    async (id: string) => {
      await persist({
        ...dataRef.current,
        customTemplates: dataRef.current.customTemplates.filter((t) => t.id !== id),
      });
    },
    [persist]
  );

  const updateRoutine = useCallback(
    async (routine: Routine) => {
      const nextRoutine = {
        ...routine,
        steps: sortSteps(routine.steps),
        updatedAt: new Date().toISOString(),
      };
      const next = {
        ...dataRef.current,
        routines: dataRef.current.routines.map((r) => (r.id === nextRoutine.id ? nextRoutine : r)),
      };
      await persist(next);
      await refreshReminders(next.routines);
    },
    [persist, refreshReminders]
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      const session = dataRef.current.session;
      const next = {
        ...dataRef.current,
        routines: dataRef.current.routines.filter((r) => r.id !== id),
        session: session?.routineId === id ? null : session,
      };
      await persist(next);
      await refreshReminders(next.routines);
      if (session?.routineId === id) {
        endsAtRef.current = null;
        setTickRemaining(null);
        await cancelScheduledNotifications();
      }
    },
    [persist, refreshReminders]
  );

  const duplicateRoutine = useCallback(
    async (id: string) => {
      const source = dataRef.current.routines.find((r) => r.id === id);
      if (!source) return null;
      const copy = cloneRoutine(source);
      const next = {
        ...dataRef.current,
        routines: [copy, ...dataRef.current.routines],
      };
      await persist(next);
      await refreshReminders(next.routines);
      return copy;
    },
    [persist, refreshReminders]
  );

  const reorderSteps = useCallback(
    async (routineId: string, steps: Step[]) => {
      const routine = dataRef.current.routines.find((r) => r.id === routineId);
      if (!routine) return;
      await updateRoutine({ ...routine, steps: sortSteps(steps) });
    },
    [updateRoutine]
  );

  const reorderRoutines = useCallback(
    async (routines: Routine[]) => {
      const current = dataRef.current.routines;
      if (routines.length !== current.length) return;
      await persist({ ...dataRef.current, routines });
    },
    [persist]
  );

  const upsertStep = useCallback(
    async (routineId: string, step: Step) => {
      const routine = dataRef.current.routines.find((r) => r.id === routineId);
      if (!routine) return;
      const exists = routine.steps.some((s) => s.id === step.id);
      const steps = exists
        ? routine.steps.map((s) => (s.id === step.id ? step : s))
        : [...routine.steps, step];
      await updateRoutine({ ...routine, steps });
    },
    [updateRoutine]
  );

  const removeStep = useCallback(
    async (routineId: string, stepId: string) => {
      const routine = dataRef.current.routines.find((r) => r.id === routineId);
      if (!routine) return;
      await updateRoutine({
        ...routine,
        steps: routine.steps.filter((s) => s.id !== stepId),
      });
    },
    [updateRoutine]
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      await persist({
        ...dataRef.current,
        settings: { ...dataRef.current.settings, ...patch },
      });
    },
    [persist]
  );

  const startSession = useCallback(
    async (routineId: string) => {
      const routine = dataRef.current.routines.find((r) => r.id === routineId);
      if (!routine || routine.steps.length === 0) return null;
      const snapshot: Routine = {
        ...routine,
        steps: sortSteps(routine.steps),
      };
      const first = snapshot.steps[0];
      const repeatCount = Math.max(1, snapshot.repeatCount);
      const session: Session = {
        id: createId('session'),
        routineId,
        routineSnapshot: snapshot,
        status: 'running',
        currentStepIndex: 0,
        remainingSec: first.durationSec,
        startedAt: new Date().toISOString(),
        repeatCount,
        currentRepeat: 1,
      };
      endsAtRef.current = Date.now() + first.durationSec * 1000;
      setTickRemaining(first.durationSec);
      await persist({ ...dataRef.current, session });
      await syncNotificationForSession(session);
      return session;
    },
    [persist, syncNotificationForSession]
  );

  const pauseSession = useCallback(async () => {
    const session = dataRef.current.session;
    if (!session || session.status !== 'running') return;
    const remaining = flushRemainingFromClock() ?? session.remainingSec;
    endsAtRef.current = null;
    setTickRemaining(remaining);
    const paused: Session = {
      ...session,
      status: 'paused',
      remainingSec: remaining,
      pauseStartedAt: new Date().toISOString(),
    };
    await persist({ ...dataRef.current, session: paused });
    await cancelScheduledNotifications();
  }, [flushRemainingFromClock, persist]);

  const resumeSession = useCallback(async () => {
    const session = dataRef.current.session;
    if (!session || session.status !== 'paused') return;
    endsAtRef.current = Date.now() + session.remainingSec * 1000;
    setTickRemaining(session.remainingSec);
    const running: Session = {
      ...session,
      status: 'running',
      pauseStartedAt: undefined,
    };
    await persist({ ...dataRef.current, session: running });
    await syncNotificationForSession(running);
  }, [persist, syncNotificationForSession]);

  const skipStep = useCallback(async () => {
    const session = dataRef.current.session;
    if (!session || (session.status !== 'running' && session.status !== 'paused')) return;
    await advanceOrComplete({ ...session, remainingSec: 0, status: 'running' });
  }, [advanceOrComplete]);

  const previousStep = useCallback(async () => {
    const session = dataRef.current.session;
    if (!session || (session.status !== 'running' && session.status !== 'paused')) return;
    const steps = sortSteps(session.routineSnapshot.steps);
    const prevIndex = Math.max(0, session.currentStepIndex - 1);
    const prev = steps[prevIndex];
    if (!prev) return;
    const updated: Session = {
      ...session,
      status: 'running',
      currentStepIndex: prevIndex,
      remainingSec: prev.durationSec,
      pauseStartedAt: undefined,
    };
    endsAtRef.current = Date.now() + prev.durationSec * 1000;
    setTickRemaining(prev.durationSec);
    await persist({ ...dataRef.current, session: updated });
    await syncNotificationForSession(updated);
  }, [persist, syncNotificationForSession]);

  const stopSession = useCallback(async () => {
    endsAtRef.current = null;
    setTickRemaining(null);
    await persist({ ...dataRef.current, session: null });
    await cancelScheduledNotifications();
  }, [persist]);

  const clearCompletedSession = useCallback(async () => {
    if (dataRef.current.session?.status !== 'completed') return;
    endsAtRef.current = null;
    setTickRemaining(null);
    await persist({ ...dataRef.current, session: null });
  }, [persist]);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      routines: data.routines,
      session: data.session,
      settings: data.settings,
      completions: data.completions,
      customTemplates: data.customTemplates,
      createRoutine,
      createRoutineFromTemplate,
      createCustomTemplate,
      saveRoutineAsTemplate,
      updateCustomTemplate,
      deleteCustomTemplate,
      updateRoutine,
      deleteRoutine,
      duplicateRoutine,
      reorderRoutines,
      reorderSteps,
      upsertStep,
      removeStep,
      updateSettings,
      startSession,
      pauseSession,
      resumeSession,
      skipStep,
      previousStep,
      stopSession,
      clearCompletedSession,
      tickRemaining,
    }),
    [
      ready,
      data.routines,
      data.session,
      data.settings,
      data.completions,
      data.customTemplates,
      createRoutine,
      createRoutineFromTemplate,
      createCustomTemplate,
      saveRoutineAsTemplate,
      updateCustomTemplate,
      deleteCustomTemplate,
      updateRoutine,
      deleteRoutine,
      duplicateRoutine,
      reorderRoutines,
      reorderSteps,
      upsertStep,
      removeStep,
      updateSettings,
      startSession,
      pauseSession,
      resumeSession,
      skipStep,
      previousStep,
      stopSession,
      clearCompletedSession,
      tickRemaining,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
