import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing } from '../theme';

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
};

const ACTION_WIDTH = 88;

export function SwipeToDeleteRow({ children, onDelete }: Props) {
  const ref = useRef<Swipeable>(null);

  const handleDelete = () => {
    ref.current?.close();
    onDelete();
  };

  const renderDeleteButton = (scale: Animated.AnimatedInterpolation<number>) => (
    <Pressable accessibilityLabel="삭제" style={styles.deleteBtn} onPress={handleDelete}>
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        <Ionicons name="trash-outline" size={24} color={colors.ink} />
      </Animated.View>
    </Pressable>
  );

  // 왼쪽으로 밀 때 (오른쪽에 휴지통)
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });
    return <View style={styles.actionWrapRight}>{renderDeleteButton(scale)}</View>;
  };

  // 오른쪽으로 밀 때 (왼쪽에 휴지통)
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, ACTION_WIDTH],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });
    return <View style={styles.actionWrapLeft}>{renderDeleteButton(scale)}</View>;
  };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      leftThreshold={ACTION_WIDTH / 2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootLeft={false}
      overshootRight={false}
      useNativeAnimations={Platform.OS !== 'web'}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionWrapRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
  },
  actionWrapLeft: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingRight: spacing.sm,
  },
  deleteBtn: {
    width: ACTION_WIDTH,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
});
