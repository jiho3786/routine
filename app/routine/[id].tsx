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
import { RoutineOptionsSection } from '../../src/components/RoutineOptionsSection';
import { Button, Screen } from '../../src/components/ui';
import { useStore } from '../../src/store';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Step } from '../../src/types';
import { formatDuration, formatDurationHuman, routineTotalSec } from '../../src/utils/time';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    routines,
    updateRoutine,
    deleteRoutine,
    duplicateRoutine,
    saveRoutineAsTemplate,
    reorderSteps,
    upsertStep,
    removeStep,
    startSession,
    session,
  } = useStore();

  const routine = routines.find((r) => r.id === id);
  const [editingStep, setEditingStep] = useState<Step | null | undefined>(undefined);
  // undefined = closed, null = new, Step = edit

  const steps = useMemo(
    () => [...(routine?.steps ?? [])].sort((a, b) => a.order - b.order),
    [routine?.steps]
  );

  const isRunningOther =
    !!session &&
    (session.status === 'running' || session.status === 'paused') &&
    session.routineId !== id;

  if (!routine) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.missing}>루틴을 찾을 수 없습니다.</Text>
        <Button title="홈으로" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const openMenu = () => {
    Alert.alert(routine.name, undefined, [
      {
        text: '템플릿으로 저장',
        onPress: async () => {
          const template = await saveRoutineAsTemplate(routine.id);
          if (template) {
            Alert.alert('저장됨', '내 템플릿에 추가했습니다.', [
              { text: '닫기', style: 'cancel' },
              {
                text: '편집하기',
                onPress: () => router.push(`/template/${template.id}`),
              },
            ]);
          }
        },
      },
      {
        text: '복제',
        onPress: async () => {
          const copy = await duplicateRoutine(routine.id);
          if (copy) router.replace(`/routine/${copy.id}`);
        },
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          Alert.alert('루틴 삭제', '이 루틴을 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: async () => {
                await deleteRoutine(routine.id);
                router.replace('/');
              },
            },
          ]),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const onStart = async () => {
    if (steps.length === 0) {
      Alert.alert('단계 필요', '최소 1개 단계를 추가한 뒤 시작하세요.');
      return;
    }
    if (isRunningOther) {
      Alert.alert('다른 루틴 실행 중', '진행 중인 세션을 종료한 뒤 시작하세요.');
      return;
    }
    const started = await startSession(routine.id);
    if (started) router.push('/player');
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '루틴 편집',
          headerRight: () => (
            <Pressable hitSlop={12} onPress={openMenu} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.headerBlock}>
        <TextInput
          value={routine.name}
          onChangeText={(name) => updateRoutine({ ...routine, name })}
          style={styles.nameInput}
          placeholder="루틴 이름"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.meta}>
          총 {formatDurationHuman(routineTotalSec(steps) * routine.repeatCount)} · {steps.length}
          단계
          {routine.repeatCount > 1 ? ` · ${routine.repeatCount}회 반복` : ''}
        </Text>
      </View>

      <RoutineOptionsSection
        routine={routine}
        onChange={(patch) => updateRoutine({ ...routine, ...patch })}
      />

      <DraggableFlatList
        data={steps}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => {
          void reorderSteps(
            routine.id,
            data.map((step, index) => ({ ...step, order: index }))
          );
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
        <Button title="시작" onPress={onStart} />
      </View>

      <StepEditorSheet
        visible={editingStep !== undefined}
        initial={editingStep ?? null}
        defaultOrder={steps.length}
        onClose={() => setEditingStep(undefined)}
        onSave={async (step) => {
          await upsertStep(routine.id, step);
          setEditingStep(undefined);
        }}
        onDelete={async (stepId) => {
          await removeStep(routine.id, stepId);
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
  },
  nameInput: {
    ...typography.largeTitle,
    color: colors.ink,
    paddingVertical: spacing.xs,
  },
  meta: {
    ...typography.subhead,
    color: colors.muted,
    marginTop: 2,
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
  stepActive: {
    opacity: 0.95,
    transform: [{ scale: 1.02 }],
  },
  handle: {
    paddingHorizontal: spacing.xs,
  },
  stepTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  stepTime: {
    marginTop: 2,
    ...typography.footnote,
    color: colors.muted,
  },
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
  addStepText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
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
