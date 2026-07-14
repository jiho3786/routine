import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { OptionsMenuSheet } from '../../src/components/OptionsMenuSheet';
import { StepEditorSheet } from '../../src/components/StepEditorSheet';
import { RoutineOptionsSection } from '../../src/components/RoutineOptionsSection';
import { SwipeToDeleteRow } from '../../src/components/SwipeToDeleteRow';
import { Button, Screen } from '../../src/components/ui';
import { useStore } from '../../src/store';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Routine, Step } from '../../src/types';
import {
  cloneRoutine,
  routineEditFingerprint,
} from '../../src/utils/routineDraft';
import { formatDuration, formatDurationHuman, routineTotalSec } from '../../src/utils/time';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    routines,
    updateRoutine,
    deleteRoutine,
    duplicateRoutine,
    saveRoutineAsTemplate,
    startSession,
    session,
  } = useStore();

  const stored = routines.find((r) => r.id === id);
  const [draft, setDraft] = useState<Routine | null>(null);
  const [editingStep, setEditingStep] = useState<Step | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  const baselineRef = useRef('');
  const allowLeaveRef = useRef(false);
  const draftRef = useRef<Routine | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!stored) {
      setDraft(null);
      baselineRef.current = '';
      return;
    }
    setDraft((prev) => {
      if (prev?.id === stored.id) return prev;
      const copy = cloneRoutine(stored);
      baselineRef.current = routineEditFingerprint(copy);
      return copy;
    });
  }, [stored]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const isDirty = useMemo(() => {
    if (!draft) return false;
    return routineEditFingerprint(draft) !== baselineRef.current;
  }, [draft]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const persistDraft = useCallback(async () => {
    const current = draftRef.current;
    if (!current) return;
    await updateRoutine(current);
    baselineRef.current = routineEditFingerprint(current);
    isDirtyRef.current = false;
  }, [updateRoutine]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      if (!isDirtyRef.current) return;

      e.preventDefault();

      Alert.alert('변경 사항 저장', '편집한 내용을 저장할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '저장 안 함',
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: '저장',
          onPress: () => {
            void (async () => {
              await persistDraft();
              allowLeaveRef.current = true;
              navigation.dispatch(e.data.action);
            })();
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, persistDraft]);

  const steps = useMemo(
    () => [...(draft?.steps ?? [])].sort((a, b) => a.order - b.order),
    [draft?.steps]
  );

  const isRunningOther =
    !!session &&
    (session.status === 'running' || session.status === 'paused') &&
    session.routineId !== id;

  const patchDraft = useCallback((patch: Partial<Routine>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const onDeleteStep = (step: Step) => {
    Alert.alert('단계 삭제', `"${step.title}" 단계를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setDraft((prev) =>
            prev
              ? { ...prev, steps: prev.steps.filter((s) => s.id !== step.id) }
              : prev
          );
        },
      },
    ]);
  };

  if (!stored) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.missing}>루틴을 찾을 수 없습니다.</Text>
        <Button title="홈으로" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!draft) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  const leaveAfter = async (action: () => void | Promise<void>) => {
    allowLeaveRef.current = true;
    await action();
  };

  const menuItems = [
    {
      key: 'save-template',
      label: '템플릿으로 저장',
      onPress: () => {
        void (async () => {
          await persistDraft();
          const template = await saveRoutineAsTemplate(draft.id);
          if (template) {
            Alert.alert('저장됨', '내 템플릿에 추가했습니다.', [
              { text: '닫기', style: 'cancel' },
              {
                text: '편집하기',
                onPress: () => router.push(`/template/${template.id}`),
              },
            ]);
          }
        })();
      },
    },
    {
      key: 'duplicate',
      label: '복제',
      onPress: () => {
        void (async () => {
          await persistDraft();
          const copy = await duplicateRoutine(draft.id);
          if (copy) {
            await leaveAfter(() => router.replace(`/routine/${copy.id}`));
          }
        })();
      },
    },
    {
      key: 'delete',
      label: '삭제',
      destructive: true,
      onPress: () =>
        Alert.alert('루틴 삭제', '이 루틴을 삭제할까요?', [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              await leaveAfter(async () => {
                await deleteRoutine(draft.id);
                router.replace('/');
              });
            },
          },
        ]),
    },
  ];

  const onStart = async () => {
    if (steps.length === 0) {
      Alert.alert('단계 필요', '최소 1개 단계를 추가한 뒤 시작하세요.');
      return;
    }
    if (isRunningOther) {
      Alert.alert('다른 루틴 실행 중', '진행 중인 세션을 종료한 뒤 시작하세요.');
      return;
    }
    if (isDirty) {
      await persistDraft();
    }
    const started = await startSession(draft.id);
    if (started) {
      await leaveAfter(() => router.push('/player'));
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '루틴 편집',
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => setMenuOpen(true)}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.headerBlock}>
        <TextInput
          value={draft.name}
          onChangeText={(name) => patchDraft({ name })}
          style={styles.nameInput}
          placeholder="루틴 이름"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.meta}>
          총 {formatDurationHuman(routineTotalSec(steps) * draft.repeatCount)} · {steps.length}
          단계
          {draft.repeatCount > 1 ? ` · ${draft.repeatCount}회 반복` : ''}
          {isDirty ? ' · 수정됨' : ''}
        </Text>
      </View>

      <RoutineOptionsSection
        routine={draft}
        onChange={(patch) => patchDraft(patch)}
      />

      <DraggableFlatList
        data={steps}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => {
          patchDraft({
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
            <SwipeToDeleteRow onDelete={() => onDeleteStep(item)}>
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
            </SwipeToDeleteRow>
          </ScaleDecorator>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title="시작" onPress={onStart} />
      </View>

      <OptionsMenuSheet
        visible={menuOpen}
        title={draft.name}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      <StepEditorSheet
        visible={editingStep !== undefined}
        initial={editingStep ?? null}
        defaultOrder={steps.length}
        onClose={() => setEditingStep(undefined)}
        onSave={(step) => {
          setDraft((prev) => {
            if (!prev) return prev;
            const exists = prev.steps.some((s) => s.id === step.id);
            const nextSteps = exists
              ? prev.steps.map((s) => (s.id === step.id ? step : s))
              : [...prev.steps, step];
            return { ...prev, steps: nextSteps };
          });
          setEditingStep(undefined);
        }}
        onDelete={(stepId) => {
          setDraft((prev) =>
            prev
              ? { ...prev, steps: prev.steps.filter((s) => s.id !== stepId) }
              : prev
          );
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
