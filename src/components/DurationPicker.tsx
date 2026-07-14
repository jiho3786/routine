import { useEffect, useMemo, useRef } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import {
  addDurationSec,
  clampDurationSec,
  durationFromVerticalDrag,
} from '../utils/duration';

const PRESETS = [
  { label: '30초', sec: 30 },
  { label: '1분', sec: 60 },
  { label: '2분', sec: 120 },
  { label: '5분', sec: 300 },
  { label: '10분', sec: 600 },
  { label: '25분', sec: 1500 },
  { label: '30분', sec: 1800 },
  { label: '60분', sec: 3600 },
] as const;

const PX_PER_MINUTE = 22;
const PX_PER_SECOND = 14;

type Props = {
  durationSec: number;
  onChange: (durationSec: number) => void;
  maxMinutes?: number;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function DurationPicker({ durationSec, onChange, maxMinutes = 180 }: Props) {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  const durationRef = useRef(durationSec);
  const onChangeRef = useRef(onChange);
  const maxRef = useRef(maxMinutes);
  const dragStartRef = useRef(durationSec);
  const lastEmittedRef = useRef(durationSec);

  useEffect(() => {
    durationRef.current = durationSec;
  }, [durationSec]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    maxRef.current = maxMinutes;
  }, [maxMinutes]);

  const emitFromDrag = (dy: number, stepSec: number, pxPerStep: number) => {
    const next = durationFromVerticalDrag(
      dragStartRef.current,
      dy,
      stepSec,
      pxPerStep,
      maxRef.current
    );
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next;
      onChangeRef.current(next);
    }
  };

  const makePan = useMemo(
    () => (stepSec: number, pxPerStep: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_: GestureResponderEvent, g: PanResponderGestureState) =>
          Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragStartRef.current = durationRef.current;
          lastEmittedRef.current = durationRef.current;
        },
        onPanResponderMove: (_e, g) => emitFromDrag(g.dy, stepSec, pxPerStep),
      }),
    []
  );

  const minutesPan = useMemo(() => makePan(60, PX_PER_MINUTE), [makePan]);
  const secondsPan = useMemo(() => makePan(1, PX_PER_SECOND), [makePan]);

  const setParts = (nextMin: number, nextSec: number) => {
    const m = Math.min(maxMinutes, Math.max(0, nextMin));
    let s = Math.min(59, Math.max(0, nextSec));
    if (m === 0 && s < 1) s = 1;
    onChange(clampDurationSec(m * 60 + s, maxMinutes));
  };

  const bumpMinutes = (delta: number) => setParts(minutes + delta, seconds);
  const bumpSeconds = (delta: number) => {
    onChange(addDurationSec(durationSec, delta, maxMinutes));
  };

  const addPreset = (sec: number) => {
    onChange(addDurationSec(durationSec, sec, maxMinutes));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.display}>
        <View style={styles.digitBlock} {...minutesPan.panHandlers}>
          <Text style={styles.digit}>{pad(minutes)}</Text>
          <Text style={styles.unit}>분</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <View style={styles.digitBlock} {...secondsPan.panHandlers}>
          <Text style={styles.digit}>{pad(seconds)}</Text>
          <Text style={styles.unit}>초</Text>
        </View>
      </View>
      <Text style={styles.dragHint}>분·초를 위·아래로 드래그하세요</Text>

      <View style={styles.controls}>
        <View style={styles.controlCol}>
          <Pressable style={styles.btn} onPress={() => bumpMinutes(1)}>
            <Text style={styles.btnText}>＋1분</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => bumpMinutes(-1)}>
            <Text style={styles.btnText}>－1분</Text>
          </Pressable>
        </View>
        <View style={styles.controlCol}>
          <Pressable style={styles.btn} onPress={() => bumpSeconds(10)}>
            <Text style={styles.btnText}>＋10초</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => bumpSeconds(-10)}>
            <Text style={styles.btnText}>－10초</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.presetLabel}>시간 더하기</Text>
      <View style={styles.presets}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.presetRow}>
            {PRESETS.slice(row * 4, row * 4 + 4).map((p) => (
              <Pressable
                key={p.label}
                style={({ pressed }) => [styles.preset, pressed && styles.presetPressed]}
                onPress={() => addPreset(p.sec)}
              >
                {({ pressed }) => (
                  <Text style={[styles.presetText, pressed && styles.presetTextPressed]}>
                    ＋{p.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  digitBlock: {
    alignItems: 'center',
    minWidth: 88,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  digit: {
    fontSize: 44,
    fontWeight: '200',
    letterSpacing: -1,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  colon: {
    fontSize: 36,
    fontWeight: '200',
    color: colors.muted,
    marginBottom: 14,
  },
  dragHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlCol: {
    flex: 1,
    gap: spacing.sm,
  },
  btn: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  btnText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.ink,
  },
  presetLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presets: {
    gap: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPressed: {
    backgroundColor: colors.ink,
  },
  presetText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  presetTextPressed: {
    color: '#FFFFFF',
  },
});
