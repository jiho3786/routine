import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { colors, spacing, typography } from '../src/theme';
import { getStreak, getTodayCount } from '../src/utils/stats';
import { formatDurationHuman, routineTotalSec } from '../src/utils/time';

export default function DoneScreen() {
  const insets = useSafeAreaInsets();
  const { session, startSession, clearCompletedSession, completions } = useStore();

  useFocusEffect(
    useCallback(() => {
      if (!session || session.status !== 'completed') {
        router.replace('/');
      }
    }, [session])
  );

  const totalSec = useMemo(() => {
    if (!session) return 0;
    return routineTotalSec(session.routineSnapshot.steps) * session.repeatCount;
  }, [session]);

  const streak = getStreak(completions);
  const todayCount = getTodayCount(completions);

  if (!session || session.status !== 'completed') {
    return <Screen />;
  }

  const onReplay = async () => {
    const routineId = session.routineId;
    await clearCompletedSession();
    const started = await startSession(routineId);
    if (started) router.replace('/player');
    else router.replace('/');
  };

  const onHome = async () => {
    await clearCompletedSession();
    router.replace('/');
  };

  return (
    <Screen style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.main}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>완료</Text>
        <Text style={styles.routineName}>{session.routineSnapshot.name}</Text>
        <Text style={styles.sub}>
          총 {formatDurationHuman(totalSec)}
          {session.repeatCount > 1 ? ` · ${session.repeatCount}회 반복` : ''}
        </Text>
        {streak > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakLabel}>
              {streak}일 연속{todayCount > 1 ? ` · 오늘 ${todayCount}회` : ''}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button title="다시 실행" onPress={onReplay} />
        <Button title="홈으로" variant="secondary" onPress={onHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  check: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    ...typography.largeTitle,
    color: colors.ink,
  },
  routineName: {
    ...typography.title3,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  sub: {
    ...typography.subhead,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakLabel: {
    ...typography.subhead,
    fontWeight: '600',
    color: '#C93400',
  },
  actions: {
    gap: spacing.sm,
  },
});
