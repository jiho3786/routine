import {
  addDurationSec,
  clampDurationSec,
  durationFromVerticalDrag,
} from '../src/utils/duration';
import { ringStrokeDashoffset } from '../src/utils/svgRing';

describe('DurationPicker 시간 규칙', () => {
  test('분·초를 초 단위로 합친다', () => {
    expect(clampDurationSec(5 * 60 + 0)).toBe(300);
    expect(clampDurationSec(1 * 60 + 30)).toBe(90);
  });

  test('0초 이하는 최소 1초로 보정한다', () => {
    expect(clampDurationSec(0)).toBe(1);
    expect(clampDurationSec(-10)).toBe(1);
  });

  test('상한은 maxMinutes·59초로 클램프한다', () => {
    expect(clampDurationSec(200 * 60 + 90, 180)).toBe(180 * 60 + 59);
  });

  test('프리셋은 현재 시간에 더한다', () => {
    expect(addDurationSec(300, 300)).toBe(600);
    expect(addDurationSec(60, 600)).toBe(660);
    expect(addDurationSec(30, 30)).toBe(60);
    expect(addDurationSec(0, 1800)).toBe(1800);
    expect(addDurationSec(60, 3600)).toBe(3660);
  });

  test('더하기는 상한을 넘지 않는다', () => {
    expect(addDurationSec(180 * 60, 600, 180)).toBe(180 * 60 + 59);
  });

  test('위로 드래그(음수 dy)하면 시간이 늘어난다', () => {
    expect(durationFromVerticalDrag(60, -44, 60, 22)).toBe(180);
    expect(durationFromVerticalDrag(30, -28, 1, 14)).toBe(32);
  });

  test('아래로 드래그(양수 dy)하면 시간이 줄어든다', () => {
    expect(durationFromVerticalDrag(120, 22, 60, 22)).toBe(60);
    expect(durationFromVerticalDrag(5, 100, 1, 14)).toBe(1);
  });
});

describe('progress helper still works alongside duration UI', () => {
  test('ringStrokeDashoffset', () => {
    expect(ringStrokeDashoffset(100, 0.5)).toBe(50);
  });
});
