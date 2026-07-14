import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
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

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.actionWrap}>
        <Pressable
          accessibilityLabel="루틴 삭제"
          style={styles.deleteBtn}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={24} color="#FF9500" />
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionWrap: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
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
