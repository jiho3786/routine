import { defaultSchedule } from '../storage';
import { ROUTINE_COLORS } from '../theme';
import type { Routine } from '../types';
import { createId } from './id';

/** 편집 비교용 — updatedAt 제외 */
export function routineEditFingerprint(routine: Routine): string {
  return JSON.stringify({
    name: routine.name,
    color: routine.color,
    icon: routine.icon,
    repeatCount: routine.repeatCount,
    schedule: routine.schedule,
    steps: [...routine.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        title: s.title,
        durationSec: s.durationSec,
        order: s.order,
      })),
  });
}

export function cloneRoutine(routine: Routine): Routine {
  return JSON.parse(JSON.stringify(routine)) as Routine;
}

/** 저장 전 로컬 초안. 홈 목록에는 아직 올리지 않는다. */
export function buildEmptyRoutine(colorIndex = 0): Routine {
  return {
    id: createId('routine'),
    name: '새 루틴',
    color: ROUTINE_COLORS[colorIndex % ROUTINE_COLORS.length],
    icon: 'timer-outline',
    updatedAt: new Date().toISOString(),
    steps: [],
    repeatCount: 1,
    schedule: defaultSchedule(),
  };
}
