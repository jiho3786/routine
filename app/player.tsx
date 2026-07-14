import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularTimerRing } from '../src/components/CircularTimerRing';
import { Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { colors, spacing, typography } from '../src/theme';
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
  const {
    session,
    tickRemaining,
    pauseSession,
    resumeSession,
    skipStep,
    previousStep,
    stopSession,
  } = useStore();

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (session.status === 'completed') {
      router.replace('/done');
    }
  }, [session]);

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
  const isPaused = session.status === 'paused';

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
          <CircularTimerRing progress={progress} remainingSec={remaining} />
          {isPaused ? <Text style={styles.pausedLabel}>일시정지</Text> : null}
        </View>

        <Text style={styles.next}>
          {next
            ? `다음 · ${next.title} (${formatDuration(next.durationSec)})`
            : session.currentRepeat < session.repeatCount
              ? `이번 회차 마지막 · 다음 ${session.currentRepeat + 1}회차`
              : '마지막 단계'}
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable style={styles.roundBtn} onPress={() => previousStep()}>
          <Ionicons name="play-back" size={24} color={colors.ink} />
        </Pressable>

        <Pressable
          style={[styles.roundBtn, styles.roundBtnPrimary]}
          onPress={() => (isPaused ? resumeSession() : pauseSession())}
        >
          <Ionicons name={isPaused ? 'play' : 'pause'} size={30} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.roundBtn} onPress={() => skipStep()}>
          <Ionicons name="play-forward" size={24} color={colors.ink} />
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
    marginVertical: spacing.lg,
    gap: spacing.sm,
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
