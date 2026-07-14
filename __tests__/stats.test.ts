import type { CompletionRecord } from '../src/types';
import {
  formatDayLabel,
  getStreak,
  getTodayCount,
  getWeekCount,
  groupCompletionsByDay,
  localDayKey,
} from '../src/utils/stats';

function record(partial: Partial<CompletionRecord> & { completedAt: string }): CompletionRecord {
  return {
    id: partial.id ?? 'c1',
    routineId: partial.routineId ?? 'r1',
    routineName: partial.routineName ?? '루틴',
    completedAt: partial.completedAt,
    totalSec: partial.totalSec ?? 60,
    repeatCount: partial.repeatCount ?? 1,
  };
}

function daysAgo(days: number, hour = 12): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('stats', () => {
  test('localDayKey는 YYYY-MM-DD 형식이다', () => {
    expect(localDayKey('2026-07-14T03:00:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('기록이 없으면 스트릭 0', () => {
    expect(getStreak([])).toBe(0);
  });

  test('오늘 완료만 있으면 스트릭 1', () => {
    expect(getStreak([record({ completedAt: daysAgo(0) })])).toBe(1);
  });

  test('어제까지만 연속이면 스트릭이 어제부터 계산된다', () => {
    expect(
      getStreak([
        record({ id: '1', completedAt: daysAgo(1) }),
        record({ id: '2', completedAt: daysAgo(2) }),
      ])
    ).toBe(2);
  });

  test('오늘과 어제 연속이면 스트릭이 이어진다', () => {
    expect(
      getStreak([
        record({ id: '1', completedAt: daysAgo(0) }),
        record({ id: '2', completedAt: daysAgo(1) }),
        record({ id: '3', completedAt: daysAgo(2) }),
      ])
    ).toBe(3);
  });

  test('중간에 빠지면 스트릭이 끊긴다', () => {
    expect(
      getStreak([
        record({ id: '1', completedAt: daysAgo(0) }),
        record({ id: '2', completedAt: daysAgo(2) }),
      ])
    ).toBe(1);
  });

  test('오늘/주간 카운트', () => {
    const list = [
      record({ id: '1', completedAt: daysAgo(0, 9) }),
      record({ id: '2', completedAt: daysAgo(0, 18) }),
      record({ id: '3', completedAt: daysAgo(3) }),
      record({ id: '4', completedAt: daysAgo(10) }),
    ];
    expect(getTodayCount(list)).toBe(2);
    expect(getWeekCount(list)).toBe(3);
  });

  test('날짜별 그룹핑과 라벨', () => {
    const today = localDayKey(new Date());
    const grouped = groupCompletionsByDay([
      record({ id: '1', completedAt: daysAgo(0) }),
      record({ id: '2', completedAt: daysAgo(0, 15) }),
    ]);
    expect(grouped[0].day).toBe(today);
    expect(grouped[0].items).toHaveLength(2);
    expect(formatDayLabel(today)).toBe('오늘');
  });
});
