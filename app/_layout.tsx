import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebPhoneFrame } from '../src/components/WebPhoneFrame';
import { StoreProvider } from '../src/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WebPhoneFrame>
          <StoreProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.accent,
                headerTitleStyle: { fontWeight: '600', fontSize: 17 },
                headerShadowVisible: false,
                headerBackTitle: '뒤로',
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" options={{ title: '내 루틴' }} />
              <Stack.Screen name="history" options={{ title: '실행 기록' }} />
              <Stack.Screen name="templates" options={{ title: '템플릿' }} />
              <Stack.Screen name="template/[id]" options={{ title: '템플릿 편집' }} />
              <Stack.Screen name="settings" options={{ title: '설정' }} />
              <Stack.Screen name="routine/[id]" options={{ title: '루틴' }} />
              <Stack.Screen
                name="player"
                options={{ title: '실행', headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="done"
                options={{ title: '완료', headerShown: false, gestureEnabled: false }}
              />
            </Stack>
          </StoreProvider>
        </WebPhoneFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
