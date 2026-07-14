import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react-native';
import { CircularTimerRing } from '../src/components/CircularTimerRing';
import {
  hasForbiddenWebSvgProps,
  ringStartAtTopTransform,
  ringStrokeDashoffset,
} from '../src/utils/svgRing';

describe('svgRing (웹 DOM 에러 방지)', () => {
  test('12시 시작을 위한 transform은 표준 SVG rotate 문자열이다', () => {
    expect(ringStartAtTopTransform(130, 130)).toBe('rotate(-90 130 130)');
  });

  test('rotation/origin 계열 prop은 웹에서 금지된다', () => {
    expect(
      hasForbiddenWebSvgProps({
        rotation: '-90',
        origin: '130, 130',
      })
    ).toEqual(expect.arrayContaining(['rotation', 'origin']));

    expect(
      hasForbiddenWebSvgProps({
        transform: ringStartAtTopTransform(130, 130),
      })
    ).toEqual([]);
  });

  test('progress clamp + dashoffset 계산', () => {
    const circumference = 100;
    expect(ringStrokeDashoffset(circumference, 1)).toBe(0);
    expect(ringStrokeDashoffset(circumference, 0)).toBe(100);
    expect(ringStrokeDashoffset(circumference, 0.5)).toBe(50);
    expect(ringStrokeDashoffset(circumference, 2)).toBe(0);
    expect(ringStrokeDashoffset(circumference, -1)).toBe(100);
  });
});

describe('CircularTimerRing 웹 transform-origin 회귀', () => {
  const sourcePath = path.join(
    __dirname,
    '..',
    'src',
    'components',
    'CircularTimerRing.tsx'
  );

  test('소스에 rotation/origin prop을 쓰지 않는다 (Invalid DOM property transform-origin 방지)', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');

    expect(source).not.toMatch(/\brotation=/);
    expect(source).not.toMatch(/\borigin=/);
    expect(source).not.toMatch(/transform-origin/);
    expect(source).not.toMatch(/transformOrigin/);
    expect(source).toMatch(/ringStartAtTopTransform|transform=\{/);
  });

  test('남은 시간을 렌더한다', async () => {
    const { getByText } = await render(
      <CircularTimerRing progress={0.5} remainingSec={125} size={200} />
    );
    expect(getByText('02:05')).toBeTruthy();
  });

  test('진행 링은 ringStartAtTopTransform을 사용한다', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    expect(source).toContain('ringStartAtTopTransform');
    expect(source).toContain('transform={ringStartAtTopTransform');
    // 예전 버그가 재발하지 않도록 정적 회귀 고정
    expect(source).not.toContain('rotation="-90"');
    expect(source).not.toContain("rotation='-90'");
    expect(source).not.toContain('origin={`${');
    expect(source).not.toContain('origin={"');
  });
});
