/**
 * react-native-svg의 rotation/origin은 웹에서 Invalid DOM property
 * `transform-origin`으로 변환되므로, 표준 SVG transform만 사용한다.
 */
export function ringStartAtTopTransform(cx: number, cy: number): string {
  return `rotate(-90 ${cx} ${cy})`;
}

/** 웹에서 React DOM 경고를 유발하는 SVG 관련 prop 이름 */
export const FORBIDDEN_WEB_SVG_PROPS = [
  'rotation',
  'origin',
  'transform-origin',
  'transformOrigin',
] as const;

export function hasForbiddenWebSvgProps(props: Record<string, unknown>): string[] {
  return FORBIDDEN_WEB_SVG_PROPS.filter((key) => key in props);
}

export function ringStrokeDashoffset(circumference: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return circumference * (1 - clamped);
}
