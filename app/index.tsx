import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, Stack, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen } from '../src/components/ui';
import { SwipeToDeleteRow } from '../src/components/SwipeToDeleteRow';
import { useStore } from '../src/store';
import { colors, radius, shadow, spacing, typography } from '../src/theme';
import type { Routine } from '../src/types';
import { resolveAppIcon } from '../src/utils/icons';
import { getStreak } from '../src/utils/stats';
import { formatDurationHuman, routineTotalSec } from '../src/utils/time';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    ready,
    routines,
    startSession,
    deleteRoutine,
    reorderRoutines,
    session,
    completions,
  } = useStore();
  const streak = getStreak(completions);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Link href="/history" asChild>
            <Pressable hitSlop={12} style={styles.headerBtn}>
              <Ionicons name="stats-chart-outline" size={22} color={colors.accent} />
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable hitSlop={12} style={styles.headerBtn}>
              <Ionicons name="settings-outline" size={22} color={colors.accent} />
            </Pressable>
          </Link>
        </View>
      ),
    });
  }, [navigation]);

  if (!ready) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  const onCreate = () => {
    router.push('/routine/new');
  };

  const onStart = async (routine: Routine) => {
    if (routine.steps.length === 0) {
      router.push(`/routine/${routine.id}`);
      return;
    }
    const started = await startSession(routine.id);
    if (started) router.push('/player');
  };

  const onTemplates = () => router.push('/templates');

  const onDelete = (routine: Routine) => {
    Alert.alert('루틴 삭제', `"${routine.name}" 루틴을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteRoutine(routine.id);
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: '루틴' }} />
      {streak > 0 ? (
        <Link href="/history" asChild>
          <Pressable style={styles.streakBanner}>
            <Ionicons name="flame" size={18} color="#FF9500" />
            <Text style={styles.streakText}>{streak}일 연속 실행 중</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </Link>
      ) : null}
      {session && (session.status === 'running' || session.status === 'paused') ? (
        <Pressable style={styles.resumeBanner} onPress={() => router.push('/player')}>
          <View style={styles.resumeIcon}>
            <Ionicons name="play" size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumeTitle}>진행 중</Text>
            <Text style={styles.resumeSub}>{session.routineSnapshot.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ) : null}

      {routines.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom + 80 }]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="timer-outline" size={40} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>루틴을 만들어 보세요</Text>
          <Text style={styles.emptySub}>
            단계별 타이머를 순서대로 실행합니다.
          </Text>
          <Button title="새 루틴" onPress={onCreate} style={{ marginTop: spacing.lg, minWidth: 160 }} />
          <Button
            title="템플릿에서 만들기"
            variant="secondary"
            onPress={onTemplates}
            style={{ marginTop: spacing.sm, minWidth: 160 }}
          />
        </View>
      ) : (
        <DraggableFlatList
          data={routines}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => {
            void reorderRoutines(data);
          }}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: insets.bottom + 100,
            gap: spacing.sm,
          }}
          ListHeaderComponent={
            routines.length > 0 ? (
              <Text style={styles.sectionLabel}>내 루틴</Text>
            ) : null
          }
          renderItem={({ item, drag, isActive }: RenderItemParams<Routine>) => (
            <ScaleDecorator>
              <SwipeToDeleteRow onDelete={() => onDelete(item)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    (pressed || isActive) && styles.cardPressed,
                  ]}
                  onPress={() => router.push(`/routine/${item.id}`)}
                  onLongPress={drag}
                  delayLongPress={200}
                  disabled={isActive}
                >
                  <Pressable
                    accessibilityLabel="순서 변경"
                    onPressIn={drag}
                    hitSlop={8}
                    style={styles.handle}
                  >
                    <Ionicons name="reorder-three" size={22} color={colors.muted} />
                  </Pressable>
                  <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                    <Ionicons
                      name={resolveAppIcon(item.icon)}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      {formatDurationHuman(routineTotalSec(item.steps) * item.repeatCount)} ·{' '}
                      {item.steps.length}단계
                      {item.repeatCount > 1 ? ` · ${item.repeatCount}회` : ''}
                      {item.schedule.enabled ? ' · 알림' : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="바로 시작"
                    hitSlop={8}
                    style={styles.playBtn}
                    onPress={() => onStart(item)}
                  >
                    <Ionicons name="play" size={18} color="#FFFFFF" />
                  </Pressable>
                </Pressable>
              </SwipeToDeleteRow>
            </ScaleDecorator>
          )}
        />
      )}

      {routines.length > 0 ? (
        <View style={[styles.fabGroup, { bottom: insets.bottom + spacing.md }]}>
          <Pressable
            style={({ pressed }) => [styles.fabSecondary, pressed && { opacity: 0.9 }]}
            onPress={onTemplates}
          >
            <Ionicons name="copy-outline" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
            onPress={onCreate}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { paddingHorizontal: spacing.sm },
  streakBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  streakText: {
    flex: 1,
    ...typography.subhead,
    fontWeight: '600',
    color: colors.ink,
  },
  sectionLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  resumeBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  resumeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTitle: { ...typography.subhead, fontWeight: '600', color: colors.ink },
  resumeSub: { ...typography.footnote, color: colors.muted, marginTop: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: spacing.sm,
    ...typography.subhead,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  handle: {
    marginRight: spacing.xs,
    marginLeft: -spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  cardMeta: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGroup: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    ...shadow.fab,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
});
