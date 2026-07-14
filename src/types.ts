export type Step = {
  id: string;
  title: string;
  durationSec: number;
  order: number;
};

export type RoutineSchedule = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** 0=일요일 … 6=토요일 (Date.getDay()) */
  weekdays: number[];
};

export type Routine = {
  id: string;
  name: string;
  color: string;
  updatedAt: string;
  steps: Step[];
  repeatCount: number;
  schedule: RoutineSchedule;
};

export type SessionStatus = 'running' | 'paused' | 'completed';

export type Session = {
  id: string;
  routineId: string;
  routineSnapshot: Routine;
  status: SessionStatus;
  currentStepIndex: number;
  remainingSec: number;
  startedAt: string;
  endedAt?: string;
  pauseStartedAt?: string;
  repeatCount: number;
  currentRepeat: number;
};

export type CompletionRecord = {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: string;
  totalSec: number;
  repeatCount: number;
};

export type Settings = {
  soundEnabled: boolean;
  hapticEnabled: boolean;
};

export type UserTemplate = {
  id: string;
  name: string;
  description: string;
  color: string;
  /** Ionicons 이름. 기본 bookmark-outline */
  icon: string;
  repeatCount: number;
  steps: Step[];
  updatedAt: string;
};

export type AppData = {
  routines: Routine[];
  session: Session | null;
  settings: Settings;
  completions: CompletionRecord[];
  customTemplates: UserTemplate[];
};
