import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { colors, radius, shadow, spacing, typography } from '../src/theme';
import {
  formatDayLabel,
  getStreak,
  getTodayCount,
  getWeekCount,
  groupCompletionsByDay,
} from '../src/utils/stats';
import { formatDurationHuman } from '../src/utils/time';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { completions } = useStore();

  const streak = getStreak(completions);
  const todayCount = getTodayCount(completions);
  const weekCount = getWeekCount(completions);
  const grouped = groupCompletionsByDay(completions);

  return (
    <Screen>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={22} color={streak > 0 ? '#FF9500' : colors.muted} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>연속 일수</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="today-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>오늘</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>{weekCount}</Text>
          <Text style={styles.statLabel}>이번 주</Text>
        </View>
      </View>

      {grouped.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Ionicons name="ribbon-outline" size={40} color={colors.muted} />
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptySub}>루틴을 완료하면 여기에 기록됩니다.</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.day}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
            gap: spacing.md,
          }}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.dayLabel}>{formatDayLabel(item.day)}</Text>
              <View style={styles.dayCard}>
                {item.items.map((record, index) => (
                  <View key={record.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.recordRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordName}>{record.routineName}</Text>
                        <Text style={styles.recordMeta}>
                          {formatDurationHuman(record.totalSec)}
                          {record.repeatCount > 1 ? ` · ${record.repeatCount}회 반복` : ''}
                        </Text>
                      </View>
                      <Text style={styles.recordTime}>
                        {new Date(record.completedAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  statValue: {
    ...typography.title2,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  emptySub: {
    ...typography.subhead,
    color: colors.muted,
    textAlign: 'center',
  },
  dayLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  recordName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  recordMeta: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
  recordTime: {
    ...typography.footnote,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
});
