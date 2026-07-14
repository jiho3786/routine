import type { Session, Step } from '../types';

function sortSteps(steps: Step[]): Step[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index }));
}

export type AdvanceResult =
  | { kind: 'next-step'; session: Session }
  | { kind: 'next-repeat'; session: Session }
  | { kind: 'completed'; session: Session };

/**
 * 타이머 단계가 끝났을 때의 순수 전이.
 * UI/스토어와 분리해 TDD로 검증한다.
 */
export function advanceSessionAfterStepEnd(from: Session): AdvanceResult {
  const steps = sortSteps(from.routineSnapshot.steps);
  const nextIndex = from.currentStepIndex + 1;

  if (nextIndex >= steps.length) {
    if (from.currentRepeat < from.repeatCount) {
      const first = steps[0];
      return {
        kind: 'next-repeat',
        session: {
          ...from,
          currentStepIndex: 0,
          currentRepeat: from.currentRepeat + 1,
          remainingSec: first.durationSec,
          status: 'running',
          awaitingConfirm: false,
        },
      };
    }

    return {
      kind: 'completed',
      session: {
        ...from,
        status: 'completed',
        remainingSec: 0,
        endedAt: new Date().toISOString(),
        awaitingConfirm: false,
      },
    };
  }

  const nextStep = steps[nextIndex];
  return {
    kind: 'next-step',
    session: {
      ...from,
      currentStepIndex: nextIndex,
      remainingSec: nextStep.durationSec,
      status: 'running',
      awaitingConfirm: false,
    },
  };
}
