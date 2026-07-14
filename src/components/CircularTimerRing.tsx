import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme';
import { ringStartAtTopTransform, ringStrokeDashoffset } from '../utils/svgRing';
import { formatDuration } from '../utils/time';

type Props = {
  progress: number;
  remainingSec: number;
  size?: number;
  strokeWidth?: number;
};

export function CircularTimerRing({
  progress,
  remainingSec,
  size = 260,
  strokeWidth = 10,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = ringStrokeDashoffset(circumference, progress);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.ringFill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={ringStartAtTopTransform(cx, cy)}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.time}>{formatDuration(remainingSec)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    ...typography.timer,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
