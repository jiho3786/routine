import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { PICKABLE_ICONS, type AppIconName } from '../utils/icons';

type Props = {
  value: string;
  color?: string;
  onChange: (icon: AppIconName) => void;
};

const CELL = 44;
const GAP = spacing.sm;
const ROWS = 2;
const GRID_HEIGHT = CELL * ROWS + GAP * (ROWS - 1);
/** 한 번에 넘길 열 수 */
const PAGE_COLS = 5;
const PAGE_WIDTH = CELL * PAGE_COLS + GAP * (PAGE_COLS - 1);

export function IconPicker({ value, color = colors.accent, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const maxOffsetRef = useRef(0);
  const layoutWidthRef = useRef(0);
  const contentWidthRef = useRef(0);
  const cellLayouts = useRef<Record<string, number>>({});

  const scrollToSelected = () => {
    const x = cellLayouts.current[value];
    if (x == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ x: Math.max(0, x - spacing.md), animated: false });
  };

  useEffect(() => {
    const id = requestAnimationFrame(scrollToSelected);
    return () => cancelAnimationFrame(id);
  }, [value]);

  const onCellLayout = (icon: string, e: LayoutChangeEvent) => {
    cellLayouts.current[icon] = e.nativeEvent.layout.x;
    if (icon === value) scrollToSelected();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.x;
  };

  const updateMaxOffset = (contentWidth: number, layoutWidth: number) => {
    maxOffsetRef.current = Math.max(0, contentWidth - layoutWidth);
  };

  const nudge = (dir: -1 | 1) => {
    const next = Math.min(
      maxOffsetRef.current,
      Math.max(0, offsetRef.current + dir * PAGE_WIDTH)
    );
    offsetRef.current = next;
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>아이콘</Text>
        <View style={styles.nav}>
          <Pressable
            accessibilityLabel="이전 아이콘"
            hitSlop={8}
            onPress={() => nudge(-1)}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-back" size={18} color={colors.inkSecondary} />
          </Pressable>
          <Pressable
            accessibilityLabel="다음 아이콘"
            hitSlop={8}
            onPress={() => nudge(1)}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onContentSizeChange={(w) => {
          contentWidthRef.current = w;
          updateMaxOffset(w, layoutWidthRef.current);
        }}
        onLayout={(e) => {
          layoutWidthRef.current = e.nativeEvent.layout.width;
          updateMaxOffset(contentWidthRef.current, layoutWidthRef.current);
        }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {PICKABLE_ICONS.map((icon, index) => {
            const selected = value === icon;
            return (
              <Pressable
                key={`${icon}-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(icon)}
                onLayout={(e) => onCellLayout(icon, e)}
                style={[
                  styles.cell,
                  selected && { backgroundColor: `${color}22`, borderColor: color },
                ]}
              >
                <Ionicons name={icon} size={22} color={selected ? color : colors.inkSecondary} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  grid: {
    height: GRID_HEIGHT,
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    columnGap: GAP,
    rowGap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
