import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { Step } from '../types';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { createId } from '../utils/id';
import { DurationPicker } from './DurationPicker';
import { Button } from './ui';

type Props = {
  visible: boolean;
  initial?: Step | null;
  defaultOrder: number;
  onClose: () => void;
  onSave: (step: Step) => void;
  onDelete?: (stepId: string) => void;
};

export function StepEditorSheet({
  visible,
  initial,
  defaultOrder,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('');
  const [durationSec, setDurationSec] = useState(300);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setTitle(initial.title);
      setDurationSec(Math.max(1, initial.durationSec));
      setNote(initial.note ?? '');
    } else {
      setTitle('');
      setDurationSec(300);
      setNote('');
    }
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}
        >
          <Text style={styles.heading}>{initial ? '단계 편집' : '단계 추가'}</Text>
          <Text style={styles.label}>제목</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="예: 스트레칭"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>시간</Text>
          <DurationPicker durationSec={durationSec} onChange={setDurationSec} />

          <Text style={styles.label}>메모 (선택)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="예: 허리 펴고 천천히"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.noteInput]}
            multiline
          />

          <View style={styles.actions}>
            <Button title="취소" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
            {initial && onDelete ? (
              <Button
                title="삭제"
                variant="danger"
                style={{ flex: 1 }}
                onPress={() => onDelete(initial.id)}
              />
            ) : null}
            <Button
              title="저장"
              style={{ flex: 1 }}
              disabled={!title.trim() || durationSec < 1}
              onPress={() =>
                onSave({
                  id: initial?.id ?? createId('step'),
                  title: title.trim(),
                  durationSec,
                  order: initial?.order ?? defaultOrder,
                  note: note.trim() || undefined,
                })
              }
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.card,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  heading: {
    ...typography.title3,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.muted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.surfaceSecondary,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
