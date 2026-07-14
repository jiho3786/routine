import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme';

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export function WebPhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <View style={styles.native}>{children}</View>;
  }

  const frameWidth = Math.min(PHONE_WIDTH, width - 24);
  const frameHeight = Math.min(PHONE_HEIGHT, height - 24);

  return (
    <View style={styles.desktop}>
      <View style={[styles.phone, { width: frameWidth, height: frameHeight }]}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  native: {
    flex: 1,
  },
  desktop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  phone: {
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 3,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 16,
  },
  notch: {
    height: 32,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
});
