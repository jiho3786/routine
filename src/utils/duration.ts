/** DurationPicker·클램프 공통 규칙 */

export function clampDurationSec(sec: number, maxMinutes = 180): number {
  const max = maxMinutes * 60 + 59;
  return Math.min(max, Math.max(1, Math.round(sec)));
}

export function addDurationSec(
  currentSec: number,
  deltaSec: number,
  maxMinutes = 180
): number {
  return clampDurationSec(currentSec + deltaSec, maxMinutes);
}

/**
 * 세로 드래그(위로 올리면 증가)로 시간 계산.
 * `pxPerStep`마다 `stepSec`만큼 반영.
 */
export function durationFromVerticalDrag(
  startSec: number,
  dy: number,
  stepSec: number,
  pxPerStep: number,
  maxMinutes = 180
): number {
  const steps = Math.round(-dy / pxPerStep);
  return clampDurationSec(startSec + steps * stepSec, maxMinutes);
}
