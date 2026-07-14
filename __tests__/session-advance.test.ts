import type { Routine, Session } from '../src/types';
import { advanceSessionAfterStepEnd } from '../src/utils/sessionAdvance';

function makeSession(overrides: Partial<Session> = {}): Session {
  const routine: Routine = {
    id: 'r1',
    name: '테스트',
    color: '#000',
    icon: 'timer-outline',
    updatedAt: new Date().toISOString(),
    repeatCount: 2,
    schedule: { enabled: false, hour: 7, minute: 0, weekdays: [] },
    steps: [
      { id: 's1', title: 'A', durationSec: 10, order: 0 },
      { id: 's2', title: 'B', durationSec: 20, order: 1 },
    ],
  };

  return {
    id: 'sess1',
    routineId: routine.id,
    routineSnapshot: routine,
    status: 'running',
    currentStepIndex: 0,
    remainingSec: 10,
    startedAt: new Date().toISOString(),
    repeatCount: 2,
    currentRepeat: 1,
    ...overrides,
  };
}

describe('advanceSessionAfterStepEnd', () => {
  test('다음 단계로 이동한다', () => {
    const result = advanceSessionAfterStepEnd(makeSession({ currentStepIndex: 0 }));
    expect(result.kind).toBe('next-step');
    if (result.kind !== 'next-step') return;
    expect(result.session.currentStepIndex).toBe(1);
    expect(result.session.remainingSec).toBe(20);
    expect(result.session.currentRepeat).toBe(1);
  });

  test('마지막 단계 후 남은 반복이 있으면 next-repeat', () => {
    const result = advanceSessionAfterStepEnd(
      makeSession({ currentStepIndex: 1, currentRepeat: 1, repeatCount: 2 })
    );
    expect(result.kind).toBe('next-repeat');
    if (result.kind !== 'next-repeat') return;
    expect(result.session.currentStepIndex).toBe(0);
    expect(result.session.currentRepeat).toBe(2);
    expect(result.session.remainingSec).toBe(10);
  });

  test('마지막 회차의 마지막 단계면 completed', () => {
    const result = advanceSessionAfterStepEnd(
      makeSession({ currentStepIndex: 1, currentRepeat: 2, repeatCount: 2 })
    );
    expect(result.kind).toBe('completed');
    if (result.kind !== 'completed') return;
    expect(result.session.status).toBe('completed');
    expect(result.session.remainingSec).toBe(0);
    expect(result.session.endedAt).toBeTruthy();
  });

  test('repeatCount 1이면 마지막 단계에서 바로 완료', () => {
    const result = advanceSessionAfterStepEnd(
      makeSession({ currentStepIndex: 1, currentRepeat: 1, repeatCount: 1 })
    );
    expect(result.kind).toBe('completed');
  });
});
