import { formatDuration, formatDurationHuman, routineTotalSec } from '../src/utils/time';

describe('time utils', () => {
  test('formatDuration', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  test('formatDurationHuman', () => {
    expect(formatDurationHuman(45)).toBe('45초');
    expect(formatDurationHuman(120)).toBe('2분');
    expect(formatDurationHuman(150)).toBe('2분 30초');
    expect(formatDurationHuman(3600)).toBe('1시간 0분');
  });

  test('routineTotalSec', () => {
    expect(routineTotalSec([{ durationSec: 30 }, { durationSec: 90 }])).toBe(120);
  });
});
