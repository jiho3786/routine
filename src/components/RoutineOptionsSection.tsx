import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Routine, RoutineSchedule } from '../types';
import { colors, radius, shadow, spacing, typography } from '../theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  routine: Routine;
  onChange: (patch: Partial<Routine>) => void;
};

function padTime(n: number) {
  return String(n).padStart(2, '0');
}

export function RoutineOptionsSection({ routine, onChange }: Props) {
  const schedule = routine.schedule;

  const updateSchedule = (patch: Partial<RoutineSchedule>) => {
    onChange({ schedule: { ...schedule, ...patch } });
  };

  const toggleWeekday = (day: number) => {
    const weekdays = schedule.weekdays.includes(day)
      ? schedule.weekdays.filter((d) => d !== day)
      : [...schedule.weekdays, day].sort((a, b) => a - b);
    updateSchedule({ weekdays });
  };

  const adjustHour = (delta: number) => {
    updateSchedule({ hour: (schedule.hour + delta + 24) % 24 });
  };

  const adjustMinute = (delta: number) => {
    updateSchedule({ minute: (schedule.minute + delta + 60) % 60 });
  };

  const adjustRepeat = (delta: number) => {
    onChange({ repeatCount: Math.max(1, Math.min(99, routine.repeatCount + delta)) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>옵션</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>반복 횟수</Text>
            <Text style={styles.hint}>전체 루틴을 몇 번 반복할지 설정</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => adjustRepeat(-1)}>
              <Ionicons name="remove" size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.stepValue}>{routine.repeatCount}</Text>
            <Pressable style={styles.stepBtn} onPress={() => adjustRepeat(1)}>
              <Ionicons name="add" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>예약 알림</Text>
            <Text style={styles.hint}>지정한 요일·시간에 알림</Text>
          </View>
          <Switch
            value={schedule.enabled}
            onValueChange={(enabled) => updateSchedule({ enabled })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>

        {schedule.enabled ? (
          <>
            <View style={styles.divider} />
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>알림 시간</Text>
              <View style={styles.timePicker}>
                <Pressable style={styles.timeBtn} onPress={() => adjustHour(-1)}>
                  <Ionicons name="chevron-down" size={16} color={colors.muted} />
                </Pressable>
                <Text style={styles.timeValue}>{padTime(schedule.hour)}</Text>
                <Pressable style={styles.timeBtn} onPress={() => adjustHour(1)}>
                  <Ionicons name="chevron-up" size={16} color={colors.muted} />
                </Pressable>
                <Text style={styles.timeColon}>:</Text>
                <Pressable style={styles.timeBtn} onPress={() => adjustMinute(-5)}>
                  <Ionicons name="chevron-down" size={16} color={colors.muted} />
                </Pressable>
                <Text style={styles.timeValue}>{padTime(schedule.minute)}</Text>
                <Pressable style={styles.timeBtn} onPress={() => adjustMinute(5)}>
                  <Ionicons name="chevron-up" size={16} color={colors.muted} />
                </Pressable>
              </View>
            </View>
            <View style={styles.weekdays}>
              {WEEKDAY_LABELS.map((label, index) => {
                const active = schedule.weekdays.includes(index);
                return (
                  <Pressable
                    key={label}
                    style={[styles.weekdayChip, active && styles.weekdayChipActive]}
                    onPress={() => toggleWeekday(index)}
                  >
                    <Text style={[styles.weekdayText, active && styles.weekdayTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.ink,
  },
  hint: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 28,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  timeRow: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  timeLabel: {
    ...typography.subhead,
    color: colors.muted,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  timeBtn: {
    padding: spacing.xs,
  },
  timeValue: {
    ...typography.title3,
    color: colors.ink,
    minWidth: 36,
    textAlign: 'center',
  },
  timeColon: {
    ...typography.title3,
    color: colors.muted,
    marginHorizontal: spacing.xs,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    gap: 4,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  weekdayChipActive: {
    backgroundColor: colors.ink,
  },
  weekdayText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.muted,
  },
  weekdayTextActive: {
    color: '#FFFFFF',
  },
});
