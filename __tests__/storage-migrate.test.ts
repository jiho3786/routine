import { __test, defaultSchedule } from '../src/storage';

const { migrateRoutine, migrateSession, migrateUserTemplate } = __test;

describe('storage migrate (legacy → 신규 필드)', () => {
  test('구버전 루틴에 repeatCount/schedule 기본값을 채운다', () => {
    const migrated = migrateRoutine({
      id: 'r1',
      name: '아침',
      color: '#007AFF',
      updatedAt: '2026-01-01T00:00:00.000Z',
      steps: [],
    });

    expect(migrated.repeatCount).toBe(1);
    expect(migrated.schedule).toEqual(defaultSchedule());
  });

  test('구버전 세션에 repeat 필드를 채운다', () => {
    const migrated = migrateSession({
      id: 's1',
      routineId: 'r1',
      status: 'running',
      currentStepIndex: 0,
      remainingSec: 30,
      startedAt: '2026-01-01T00:00:00.000Z',
      routineSnapshot: {
        id: 'r1',
        name: '운동',
        color: '#000',
        updatedAt: '2026-01-01T00:00:00.000Z',
        steps: [{ id: 'st1', title: 'A', durationSec: 30, order: 0 }],
        // repeatCount/schedule 없음
      } as never,
    });

    expect(migrated.repeatCount).toBe(1);
    expect(migrated.currentRepeat).toBe(1);
    expect(migrated.routineSnapshot.repeatCount).toBe(1);
    expect(migrated.routineSnapshot.schedule.enabled).toBe(false);
  });

  test('이미 있는 schedule/repeatCount는 유지한다', () => {
    const migrated = migrateRoutine({
      id: 'r1',
      name: '공부',
      color: '#000',
      updatedAt: '2026-01-01T00:00:00.000Z',
      steps: [],
      repeatCount: 4,
      schedule: {
        enabled: true,
        hour: 9,
        minute: 30,
        weekdays: [1, 3, 5],
      },
    });

    expect(migrated.repeatCount).toBe(4);
    expect(migrated.schedule.enabled).toBe(true);
    expect(migrated.schedule.hour).toBe(9);
    expect(migrated.schedule.weekdays).toEqual([1, 3, 5]);
  });

  test('커스텀 템플릿 기본값을 채운다', () => {
    const migrated = migrateUserTemplate({
      id: 't1',
      name: '내 템플릿',
      steps: [{ id: 's1', title: 'A', durationSec: 60, order: 0 }],
    });
    expect(migrated.description).toBe('');
    expect(migrated.icon).toBe('bookmark-outline');
    expect(migrated.repeatCount).toBe(1);
    expect(migrated.color).toBe('#1D1D1F');
  });
});
