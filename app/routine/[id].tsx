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
import { IconPicker } from '../../src/components/IconPicker';
import { OptionsMenuSheet } from '../../src/components/OptionsMenuSheet';
import { StepEditorSheet } from '../../src/components/StepEditorSheet';
import { RoutineOptionsSection } from '../../src/components/RoutineOptionsSection';
import { SwipeToDeleteRow } from '../../src/components/SwipeToDeleteRow';
import { Button, Screen } from '../../src/components/ui';
import { useStore } from '../../src/store';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Routine, Step } from '../../src/types';
import { resolveAppIcon } from '../../src/utils/icons';
import {
  buildEmptyRoutine,
  cloneRoutine,
  routineEditFingerprint,
} from '../../src/utils/routineDraft';
import { formatDuration, formatDurationHuman, routineTotalSec } from '../../src/utils/time';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    routines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    duplicateRoutine,
    saveRoutineAsTemplate,
  } = useStore();

  const stored = isNew ? undefined : routines.find((r) => r.id === id);
  const [draft, setDraft] = useState<Routine | null>(null);
  const [editingStep, setEditingStep] = useState<Step | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  const baselineRef = useRef('');
  const allowLeaveRef = useRef(false);
  const draftRef = useRef<Routine | null>(null);
  const isDirtyRef = useRef(false);
  const isNewRef = useRef(isNew);
  const newInitRef = useRef(false);

  useEffect(() => {
    isNewRef.current = isNew;
  }, [isNew]);

  useEffect(() => {
    if (isNew) {
      if (newInitRef.current) return;
      newInitRef.current = true;
      const copy = buildEmptyRoutine(routines.length);
      baselineRef.current = routineEditFingerprint(copy);
      setDraft(copy);
      return;
    }
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
  }, [isNew, stored, routines.length]);

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
    if (isNewRef.current) {
      await createRoutine(current);
    } else {
      await updateRoutine(current);
    }
    baselineRef.current = routineEditFingerprint(current);
    isDirtyRef.current = false;
  }, [createRoutine, updateRoutine]);

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

  if (!isNew && !stored) {
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

  const onSave = async () => {
    await persistDraft();
    await leaveAfter(() => router.replace('/'));
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: isNew ? '새 루틴' : '루틴 편집',
          headerRight: isNew
            ? undefined
            : () => (
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
          paddingBottom: 120 + insets.bottom,
          gap: spacing.sm,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <View style={[styles.previewIcon, { backgroundColor: `${draft.color}22` }]}>
                  <Ionicons
                    name={resolveAppIcon(draft.icon)}
                    size={28}
                    color={draft.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={draft.name}
                    onChangeText={(name) => patchDraft({ name })}
                    style={styles.nameInput}
                    placeholder="루틴 이름"
                    placeholderTextColor={colors.muted}
                  />
                  <Text style={styles.meta}>
                    총 {formatDurationHuman(routineTotalSec(steps) * draft.repeatCount)} ·{' '}
                    {steps.length}단계
                    {draft.repeatCount > 1 ? ` · ${draft.repeatCount}회 반복` : ''}
                    {isDirty ? ' · 수정됨' : ''}
                  </Text>
                </View>
              </View>

              <IconPicker
                value={draft.icon}
                color={draft.color}
                onChange={(icon) => patchDraft({ icon })}
              />
            </View>

            <RoutineOptionsSection
              routine={draft}
              onChange={(patch) => patchDraft(patch)}
            />

            <Text style={styles.sectionLabel}>단계</Text>
          </View>
        }
        ListFooterComponent={
          <Pressable style={styles.addStep} onPress={() => setEditingStep(null)}>
            <Ionicons name="add" size={20} color={colors.accentDeep} />
            <Text style={styles.addStepText}>단계 추가</Text>
          </Pressable>
        }
        renderItem={({ item, drag, isActive }: RenderItemParams<Step>) => (
          <ScaleDecorator>
            <View style={styles.stepPad}>
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
            </View>
          </ScaleDecorator>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title="저장" onPress={onSave} />
      </View>

      {!isNew ? (
        <OptionsMenuSheet
          visible={menuOpen}
          title={draft.name}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  sectionLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md + spacing.xs,
  },
  stepPad: {
    paddingHorizontal: spacing.md,
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
    marginHorizontal: spacing.md,
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
