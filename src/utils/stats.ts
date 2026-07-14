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
