import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepEditorSheet } from '../../src/components/StepEditorSheet';
import { Button, Screen } from '../../src/components/ui';
import { useStore } from '../../src/store';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Step } from '../../src/types';
import { formatDuration, formatDurationHuman, routineTotalSec } from '../../src/utils/time';

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    customTemplates,
    updateCustomTemplate,
    deleteCustomTemplate,
    createRoutineFromTemplate,
  } = useStore();

  const template = customTemplates.find((t) => t.id === id);
  const [editingStep, setEditingStep] = useState<Step | null | undefined>(undefined);

  const steps = useMemo(
    () => [...(template?.steps ?? [])].sort((a, b) => a.order - b.order),
    [template?.steps]
  );

  if (!template) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.missing}>템플릿을 찾을 수 없습니다.</Text>
        <Button title="목록으로" onPress={() => router.replace('/templates')} />
      </Screen>
    );
  }

  const openMenu = () => {
    Alert.alert(template.name, undefined, [
      {
        text: '루틴으로 만들기',
        onPress: async () => {
          const routine = await createRoutineFromTemplate(template.id);
          if (routine) router.replace(`/routine/${routine.id}`);
        },
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
              onPress: async () => {
                await deleteCustomTemplate(template.id);
                router.replace('/templates');
              },
            },
          ]),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const adjustRepeat = (delta: number) => {
    void updateCustomTemplate({
      ...template,
      repeatCount: Math.max(1, Math.min(99, template.repeatCount + delta)),
    });
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '템플릿 편집',
          headerRight: () => (
            <Pressable hitSlop={12} onPress={openMenu} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.headerBlock}>
        <TextInput
          value={template.name}
          onChangeText={(name) => updateCustomTemplate({ ...template, name })}
          style={styles.nameInput}
          placeholder="템플릿 이름"
          placeholderTextColor={colors.muted}
        />
        <TextInput
          value={template.description}
          onChangeText={(description) => updateCustomTemplate({ ...template, description })}
          style={styles.descInput}
          placeholder="설명 (선택)"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.meta}>
          총 {formatDurationHuman(routineTotalSec(steps) * template.repeatCount)} · {steps.length}
          단계
          {template.repeatCount > 1 ? ` · ${template.repeatCount}회 반복` : ''}
        </Text>

        <View style={styles.repeatRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.repeatLabel}>반복 횟수</Text>
            <Text style={styles.repeatHint}>루틴 생성 시 기본값</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => adjustRepeat(-1)}>
              <Ionicons name="remove" size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.stepValue}>{template.repeatCount}</Text>
            <Pressable style={styles.stepBtn} onPress={() => adjustRepeat(1)}>
              <Ionicons name="add" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </View>

      <DraggableFlatList
        data={steps}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => {
          void updateCustomTemplate({
            ...template,
            steps: data.map((step, index) => ({ ...step, order: index })),
          });
        }}
        containerStyle={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 120 + insets.bottom,
          gap: spacing.sm,
        }}
        ListFooterComponent={
          <Pressable style={styles.addStep} onPress={() => setEditingStep(null)}>
            <Ionicons name="add" size={20} color={colors.accentDeep} />
            <Text style={styles.addStepText}>단계 추가</Text>
          </Pressable>
        }
        renderItem={({ item, drag, isActive }: RenderItemParams<Step>) => (
          <ScaleDecorator>
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              onPress={() => setEditingStep(item)}
              style={[styles.stepCard, isActive && styles.stepActive]}
            >
              <Pressable onPressIn={drag} hitSlop={8} style={styles.handle}>
                <Ionicons name="menu" size={22} color={colors.muted} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepTime}>{formatDuration(item.durationSec)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </ScaleDecorator>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="이 템플릿으로 루틴 만들기"
          onPress={async () => {
            if (steps.length === 0) {
              Alert.alert('단계 필요', '최소 1개 단계를 추가하세요.');
              return;
            }
            const routine = await createRoutineFromTemplate(template.id);
            if (routine) router.replace(`/routine/${routine.id}`);
          }}
        />
      </View>

      <StepEditorSheet
        visible={editingStep !== undefined}
        initial={editingStep ?? null}
        defaultOrder={steps.length}
        onClose={() => setEditingStep(undefined)}
        onSave={async (step) => {
          const exists = template.steps.some((s) => s.id === step.id);
          const nextSteps = exists
            ? template.steps.map((s) => (s.id === step.id ? step : s))
            : [...template.steps, step];
          await updateCustomTemplate({ ...template, steps: nextSteps });
          setEditingStep(undefined);
        }}
        onDelete={async (stepId) => {
          await updateCustomTemplate({
            ...template,
            steps: template.steps.filter((s) => s.id !== stepId),
          });
          setEditingStep(undefined);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  missing: { ...typography.body, color: colors.muted },
  headerBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  nameInput: {
    ...typography.largeTitle,
    color: colors.ink,
    paddingVertical: spacing.xs,
  },
  descInput: {
    ...typography.subhead,
    color: colors.inkSecondary,
    paddingVertical: 4,
  },
  meta: {
    ...typography.subhead,
    color: colors.muted,
    marginTop: 4,
  },
  repeatRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  repeatLabel: { ...typography.body, color: colors.ink },
  repeatHint: { ...typography.footnote, color: colors.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  stepActive: { opacity: 0.95, transform: [{ scale: 1.02 }] },
  handle: { paddingHorizontal: spacing.xs },
  stepTitle: { ...typography.body, fontWeight: '600', color: colors.ink },
  stepTime: { marginTop: 2, ...typography.footnote, color: colors.muted },
  addStep: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    ...shadow.card,
  },
  addStepText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});
