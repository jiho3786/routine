import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularTimerRing } from '../src/components/CircularTimerRing';
import { Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { colors, radius, spacing, typography } from '../src/theme';
import { formatDuration } from '../src/utils/time';

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.dotActive,
            i < current && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  useKeepAwake();
  const {
    session,
    settings,
    tickRemaining,
    pauseSession,
    resumeSession,
    skipStep,
    previousStep,
    stopSession,
  } = useStore();

  const prepSec = settings.prepCountdownSec;
  const [prepLeft, setPrepLeft] = useState<number | null>(null);
  const preppedKeyRef = useRef<string | null>(null);

  const stepKey =
    session && session.status !== 'completed'
      ? `${session.id}-${session.currentRepeat}-${session.currentStepIndex}`
      : null;

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (session.status === 'completed') {
      router.replace('/done');
    }
  }, [session]);

  // 새 단계로 넘어갈 때마다 준비 카운트다운 시작 (타이머는 일시정지 후 재개)
  useEffect(() => {
    if (stepKey == null) return;
    if (prepSec <= 0) return;
    if (preppedKeyRef.current === stepKey) return;
    preppedKeyRef.current = stepKey;
    setPrepLeft(prepSec);
    void pauseSession();
  }, [stepKey, prepSec, pauseSession]);

  useEffect(() => {
    if (prepLeft == null) return;
    if (prepLeft <= 0) {
      setPrepLeft(null);
      void resumeSession();
      return;
    }
    const t = setTimeout(() => setPrepLeft((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [prepLeft, resumeSession]);

  const steps = useMemo(
    () => [...(session?.routineSnapshot.steps ?? [])].sort((a, b) => a.order - b.order),
    [session?.routineSnapshot.steps]
  );

  if (!session || session.status === 'completed') {
    return <Screen />;
  }

  const index = session.currentStepIndex;
  const current = steps[index];
  const next = steps[index + 1];
  const remaining = tickRemaining ?? session.remainingSec;
  const total = current?.durationSec || 1;
  const progress = remaining / total;
  const isPreparing = prepLeft != null;
  const isPaused = session.status === 'paused' && !isPreparing;

  const skipPrep = () => {
    if (!isPreparing) return;
    setPrepLeft(0);
  };

  const onExit = () => {
    Alert.alert('실행 종료', '진행 중인 루틴을 종료할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        style: 'destructive',
        onPress: async () => {
          await stopSession();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Screen style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.inkSecondary} />
        </Pressable>
        <Text style={styles.stepCount}>
          {index + 1} / {steps.length}
          {session.repeatCount > 1
            ? ` · ${session.currentRepeat}/${session.repeatCount}회`
            : ''}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.main}>
        <Text style={styles.routineName}>{session.routineSnapshot.name}</Text>
        <Text style={styles.stepName}>{current?.title ?? '단계'}</Text>
        <StepDots total={steps.length} current={index} />

        <View style={styles.ringSection}>
          {isPreparing ? (
            <Pressable style={styles.prepBox} onPress={skipPrep}>
              <Text style={styles.prepLabel}>준비</Text>
              <Text style={styles.prepNumber}>{prepLeft}</Text>
              <Text style={styles.prepHint}>탭하여 바로 시작</Text>
            </Pressable>
          ) : (
            <>
              <CircularTimerRing progress={progress} remainingSec={remaining} />
              {isPaused ? <Text style={styles.pausedLabel}>일시정지</Text> : null}
            </>
          )}
        </View>

        {current?.note ? (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <Text style={styles.noteText}>{current.note}</Text>
          </View>
        ) : null}

        <Text style={styles.next}>
          {next
            ? `다음 · ${next.title} (${formatDuration(next.durationSec)})`
            : session.currentRepeat < session.repeatCount
              ? `이번 회차 마지막 · 다음 ${session.currentRepeat + 1}회차`
              : '마지막 단계'}
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={styles.roundBtn}
          disabled={isPreparing}
          onPress={() => previousStep()}
        >
          <Ionicons name="play-back" size={24} color={isPreparing ? colors.muted : colors.ink} />
        </Pressable>

        <Pressable
          style={[styles.roundBtn, styles.roundBtnPrimary]}
          disabled={isPreparing}
          onPress={() => (isPaused ? resumeSession() : pauseSession())}
        >
          <Ionicons name={isPaused ? 'play' : 'pause'} size={30} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.roundBtn} disabled={isPreparing} onPress={() => skipStep()}>
          <Ionicons
            name="play-forward"
            size={24}
            color={isPreparing ? colors.muted : colors.ink}
          />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  routineName: {
    ...typography.subhead,
    color: colors.muted,
    fontWeight: '500',
  },
  stepName: {
    ...typography.title2,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.ringFill,
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: colors.muted,
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
    minHeight: 220,
  },
  prepBox: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.separator,
    gap: 2,
  },
  prepLabel: {
    ...typography.subhead,
    color: colors.muted,
    fontWeight: '600',
    letterSpacing: 2,
  },
  prepNumber: {
    fontSize: 88,
    fontWeight: '200',
    color: colors.ink,
    letterSpacing: -2,
  },
  prepHint: {
    ...typography.caption,
    color: colors.muted,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 320,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
  },
  noteText: {
    ...typography.subhead,
    color: colors.inkSecondary,
    flexShrink: 1,
  },
  pausedLabel: {
    ...typography.footnote,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  next: {
    ...typography.subhead,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  roundBtnPrimary: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
});
