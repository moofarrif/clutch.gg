import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { customFonts, colors } from '../theme';
import { QueryProvider } from '../services/query';
import { useAuthStore } from '../stores/auth';
import { useNotifications } from '../hooks/useNotifications';
import { config } from '../config';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(customFonts);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
    config.hydrate();
  }, [hydrate]);

  // Auth guard: redirect to login when session expires
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = segments[0] === undefined || segments[0] === 'index';

    if (!isAuthenticated && !inAuthGroup && !isIndex) {
      // Session expired or logged out while in protected screens → go to login
      router.replace('/(auth)/sign-in');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Register push notifications after auth hydration
  useNotifications();

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="match/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="squad" />
          <Stack.Screen name="user" />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
