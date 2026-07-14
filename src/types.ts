export type Step = {
  id: string;
  title: string;
  durationSec: number;
  order: number;
  /** 단계 안내 메모 (선택). 플레이어에 표시 */
  note?: string;
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
  /** Ionicons 이름. 기본 timer-outline */
  icon: string;
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
  /** 단계 종료 후 다음으로 가기 전 사용자 확인 대기 */
  awaitingConfirm?: boolean;
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
  /** 각 단계 시작 전 준비 카운트다운 초. 0이면 끔 */
  prepCountdownSec: number;
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
