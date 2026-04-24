import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../atoms';
import { TopAppBar } from './TopAppBar';
import { colors, spacing } from '../../theme';

interface DetailLayoutProps {
  title: string;
  onBack: () => void;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaDisabled?: boolean;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
}

export function DetailLayout({ title, onBack, ctaLabel, onCtaPress, ctaDisabled, children, rightActions }: DetailLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <TopAppBar title={title} showBack onBack={onBack} rightActions={rightActions} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 72, paddingBottom: ctaLabel ? 120 : insets.bottom + 24 },
        ]}
      >
        {children}
      </ScrollView>
      {ctaLabel && (
        <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={onCtaPress}
            disabled={ctaDisabled}
            style={[styles.ctaBtn, ctaDisabled && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Text variant="headlineSmall" color="onPrimaryFixed" style={{ fontSize: 18 }}>
              {ctaLabel}
            </Text>
            <Text variant="bodyMedium" color="onPrimaryFixed">⚡</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(25,25,28,0.9)',
  },
  ctaBtn: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 20,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
