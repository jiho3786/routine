import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen } from '../src/components/ui';
import { useStore } from '../src/store';
import { ROUTINE_TEMPLATES, type RoutineTemplate } from '../src/templates';
import { colors, radius, shadow, spacing, typography } from '../src/theme';
import type { UserTemplate } from '../src/types';
import { formatDurationHuman } from '../src/utils/time';

type ListItem =
  | { kind: 'header'; title: string; key: string }
  | { kind: 'custom'; template: UserTemplate; key: string }
  | { kind: 'builtin'; template: RoutineTemplate; key: string }
  | { kind: 'empty-custom'; key: string };

function templateMeta(steps: { durationSec: number }[], repeatCount: number) {
  const totalSec = steps.reduce((sum, s) => sum + s.durationSec, 0) * repeatCount;
  return `${formatDurationHuman(totalSec)} · ${steps.length}단계${
    repeatCount > 1 ? ` · ${repeatCount}회 반복` : ''
  }`;
}

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const {
    customTemplates,
    createRoutineFromTemplate,
    createCustomTemplate,
    deleteCustomTemplate,
  } = useStore();

  const onUse = async (templateId: string) => {
    const routine = await createRoutineFromTemplate(templateId);
    if (routine) router.replace(`/routine/${routine.id}`);
  };

  const onCreate = async () => {
    const template = await createCustomTemplate();
    router.push(`/template/${template.id}`);
  };

  const onCustomLongPress = (template: UserTemplate) => {
    Alert.alert(template.name, undefined, [
      { text: '편집', onPress: () => router.push(`/template/${template.id}`) },
      {
        text: '루틴으로 만들기',
        onPress: () => void onUse(template.id),
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          Alert.alert('템플릿 삭제', '이 템플릿을 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () => void deleteCustomTemplate(template.id),
            },
          ]),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const data: ListItem[] = [
    { kind: 'header', title: '내 템플릿', key: 'h-custom' },
    ...(customTemplates.length === 0
      ? ([{ kind: 'empty-custom', key: 'empty-custom' }] as ListItem[])
      : customTemplates.map(
          (template): ListItem => ({
            kind: 'custom',
            template,
            key: template.id,
          })
        )),
    { kind: 'header', title: '기본 템플릿', key: 'h-builtin' },
    ...ROUTINE_TEMPLATES.map(
      (template): ListItem => ({
        kind: 'builtin',
        template,
        key: template.id,
      })
    ),
  ];

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: insets.bottom + 100,
          gap: spacing.sm,
        }}
        ListHeaderComponent={
          <Text style={styles.header}>
            내 템플릿을 만들거나, 기본 템플릿으로 빠르게 시작할 수 있어요.
          </Text>
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return <Text style={styles.section}>{item.title}</Text>;
          }
          if (item.kind === 'empty-custom') {
            return (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>아직 만든 템플릿이 없습니다.</Text>
                <Button title="새 템플릿 만들기" onPress={onCreate} style={{ marginTop: spacing.sm }} />
              </View>
            );
          }
          if (item.kind === 'custom') {
            const t = item.template;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/template/${t.id}`)}
                onLongPress={() => onCustomLongPress(t)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${t.color}22` }]}>
                  <Ionicons
                    name={(t.icon as keyof typeof Ionicons.glyphMap) || 'bookmark-outline'}
                    size={24}
                    color={t.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{t.name}</Text>
                  {t.description ? <Text style={styles.desc}>{t.description}</Text> : null}
                  <Text style={styles.meta}>{templateMeta(t.steps, t.repeatCount)}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  style={styles.useBtn}
                  onPress={() => void onUse(t.id)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              </Pressable>
            );
          }

          const t = item.template;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => void onUse(t.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${t.color}22` }]}>
                <Ionicons name={t.icon} size={24} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.name}</Text>
                <Text style={styles.desc}>{t.description}</Text>
                <Text style={styles.meta}>{templateMeta(t.steps, t.repeatCount)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        }}
      />

      {customTemplates.length > 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + spacing.md },
            pressed && { opacity: 0.9 },
          ]}
          onPress={onCreate}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.subhead,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  section: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  emptyText: {
    ...typography.subhead,
    color: colors.muted,
    textAlign: 'center',
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
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  desc: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
  meta: {
    marginTop: 4,
    ...typography.caption,
    color: colors.muted,
  },
  useBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
});
