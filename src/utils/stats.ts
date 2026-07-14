import type { CompletionRecord } from '../types';

export function localDayKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCompletionDays(completions: CompletionRecord[]): Set<string> {
  return new Set(completions.map((c) => localDayKey(c.completedAt)));
}

export function getStreak(completions: CompletionRecord[]): number {
  const days = getCompletionDays(completions);
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDayKey(cursor))) return 0;
  }

  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTodayCount(completions: CompletionRecord[]): number {
  const today = localDayKey(new Date());
  return completions.filter((c) => localDayKey(c.completedAt) === today).length;
}

export function getWeekCount(completions: CompletionRecord[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return completions.filter((c) => new Date(c.completedAt) >= start).length;
}

export function groupCompletionsByDay(
  completions: CompletionRecord[]
): { day: string; items: CompletionRecord[] }[] {
  const sorted = [...completions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  const map = new Map<string, CompletionRecord[]>();
  for (const item of sorted) {
    const key = localDayKey(item.completedAt);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()].map(([day, items]) => ({ day, items }));
}

export type HeatCell = { dayKey: string; count: number; isFuture: boolean };
export type HeatColumn = { days: HeatCell[] };

/** 완료 기록을 요일(세로)×주(가로) 히트맵 격자로 변환 */
export function buildContributionGrid(
  completions: CompletionRecord[],
  weeks = 15,
  now: Date = new Date()
): { columns: HeatColumn[]; max: number } {
  const counts = new Map<string, number>();
  for (const c of completions) {
    const key = localDayKey(c.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() - today.getDay());
  const startSunday = new Date(currentWeekSunday);
  startSunday.setDate(currentWeekSunday.getDate() - (weeks - 1) * 7);

  const columns: HeatColumn[] = [];
  let max = 0;
  for (let w = 0; w < weeks; w++) {
    const days: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startSunday);
      date.setDate(startSunday.getDate() + w * 7 + d);
      const key = localDayKey(date);
      const count = counts.get(key) ?? 0;
      const isFuture = date.getTime() > today.getTime();
      if (!isFuture && count > max) max = count;
      days.push({ dayKey: key, count, isFuture });
    }
    columns.push({ days });
  }
  return { columns, max };
}

/** 0(없음)~4(가장 많음) 강도 단계 */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/** 최근 N일 중 하나 이상 완료한 날 수와 비율 */
export function getActiveDayRate(
  completions: CompletionRecord[],
  days = 30,
  now: Date = new Date()
): { activeDays: number; totalDays: number; rate: number } {
  const set = getCompletionDays(completions);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  let activeDays = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (set.has(localDayKey(d))) activeDays++;
  }
  const rate = days > 0 ? activeDays / days : 0;
  return { activeDays, totalDays: days, rate };
}

export function formatDayLabel(dayKey: string): string {
  const today = localDayKey(new Date());
  const yesterday = localDayKey(new Date(Date.now() - 86400000));
  if (dayKey === today) return '오늘';
  if (dayKey === yesterday) return '어제';
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${m}월 ${d}일 (${weekdays[date.getDay()]})`;
}
