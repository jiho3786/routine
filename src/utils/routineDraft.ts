import type { Routine } from '../types';

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
