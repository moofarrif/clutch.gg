import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { useOnboarding } from '../hooks/useOnboarding';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { hasSeenOnboarding } = useOnboarding();

  // Still loading onboarding state
  if (hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primaryContainer} />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(tabs)/explore" />;
  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(auth)/sign-in" />;
}
