import {
  buildEmptyRoutine,
  cloneRoutine,
  routineEditFingerprint,
} from '../src/utils/routineDraft';
import type { Routine } from '../src/types';

const sample: Routine = {
  id: 'r1',
  name: '아침',
  color: '#007AFF',
  icon: 'sunny-outline',
  updatedAt: '2026-01-01T00:00:00.000Z',
  repeatCount: 1,
  schedule: { enabled: false, hour: 7, minute: 0, weekdays: [1, 2, 3, 4, 5] },
  steps: [
    { id: 's2', title: 'B', durationSec: 20, order: 1 },
    { id: 's1', title: 'A', durationSec: 10, order: 0 },
  ],
};

describe('routineDraft', () => {
  test('단계 순서와 무관하게 동일한 fingerprint', () => {
    const a = routineEditFingerprint(sample);
    const b = routineEditFingerprint({
      ...sample,
      steps: [...sample.steps].reverse(),
    });
    expect(a).toBe(b);
  });

  test('이름 변경 시 fingerprint가 달라진다', () => {
    expect(routineEditFingerprint(sample)).not.toBe(
      routineEditFingerprint({ ...sample, name: '저녁' })
    );
  });

  test('cloneRoutine은 깊은 복사한다', () => {
    const copy = cloneRoutine(sample);
    copy.steps[0].title = '변경';
    expect(sample.steps.find((s) => s.id === copy.steps[0].id)?.title).not.toBe('변경');
  });

  test('buildEmptyRoutine은 저장 전 초안을 만든다', () => {
    const draft = buildEmptyRoutine(0);
    expect(draft.name).toBe('새 루틴');
    expect(draft.steps).toEqual([]);
    expect(draft.icon).toBe('timer-outline');
    expect(draft.id).toMatch(/^routine_/);
  });
});
