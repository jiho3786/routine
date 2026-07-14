import type { CompletionRecord } from '../src/types';
import {
  buildContributionGrid,
  formatDayLabel,
  getActiveDayRate,
  getStreak,
  getTodayCount,
  getWeekCount,
  groupCompletionsByDay,
  heatLevel,
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

  test('heatLevel: 0은 없음, max 이하 비율로 1~4', () => {
    expect(heatLevel(0, 5)).toBe(0);
    expect(heatLevel(1, 4)).toBe(1);
    expect(heatLevel(2, 4)).toBe(2);
    expect(heatLevel(3, 4)).toBe(3);
    expect(heatLevel(4, 4)).toBe(4);
    expect(heatLevel(1, 1)).toBe(4);
  });

  test('buildContributionGrid: weeks×7 격자, 오늘 이후는 미래 처리', () => {
    const now = new Date('2026-07-14T12:00:00'); // 화요일
    const { columns, max } = buildContributionGrid(
      [record({ id: '1', completedAt: '2026-07-14T09:00:00' })],
      15,
      now
    );
    expect(columns).toHaveLength(15);
    columns.forEach((c) => expect(c.days).toHaveLength(7));

    const flat = columns.flatMap((c) => c.days);
    const todayKey = localDayKey(now);
    const todayCell = flat.find((d) => d.dayKey === todayKey)!;
    expect(todayCell.count).toBe(1);
    expect(todayCell.isFuture).toBe(false);
    expect(max).toBe(1);

    // 이번 주 수~토는 미래
    const future = flat.filter((d) => d.isFuture);
    expect(future.length).toBeGreaterThan(0);
    future.forEach((d) => expect(d.count).toBe(0));
  });

  test('getActiveDayRate: 최근 N일 중 실천일 비율', () => {
    const now = new Date('2026-07-14T12:00:00');
    const list = [
      record({ id: '1', completedAt: '2026-07-14T09:00:00' }),
      record({ id: '2', completedAt: '2026-07-13T09:00:00' }),
      record({ id: '3', completedAt: '2026-07-13T20:00:00' }), // 같은 날 중복
      record({ id: '4', completedAt: '2026-07-01T09:00:00' }),
    ];
    const { activeDays, totalDays, rate } = getActiveDayRate(list, 30, now);
    expect(totalDays).toBe(30);
    expect(activeDays).toBe(3);
    expect(rate).toBeCloseTo(3 / 30);
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
