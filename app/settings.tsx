import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { colors, radius, shadow, spacing, typography } from '../src/theme';

export default function SettingsScreen() {
  const { settings, updateSettings } = useStore();

  return (
    <Screen style={styles.root}>
      <Text style={styles.section}>피드백</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>사운드</Text>
            <Text style={styles.hint}>단계 전환 시 햅틱 (백그라운드는 알림음)</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>햅틱</Text>
            <Text style={styles.hint}>단계 전환·버튼 진동</Text>
          </View>
          <Switch
            value={settings.hapticEnabled}
            onValueChange={(hapticEnabled) => updateSettings({ hapticEnabled })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
      </View>
      <Text style={styles.footer}>
        데이터는 이 기기에만 저장됩니다.{'\n'}
        Android Expo Go에서는 백그라운드 알림이 비활성화됩니다.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.md,
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
    fontWeight: '400',
    color: colors.ink,
  },
  hint: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 0,
  },
  footer: {
    marginTop: spacing.lg,
    textAlign: 'center',
    ...typography.footnote,
    color: colors.muted,
    lineHeight: 18,
  },
});
