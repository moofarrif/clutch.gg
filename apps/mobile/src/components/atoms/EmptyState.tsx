import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { colors, spacing } from '../../theme';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
}

export function EmptyState({ icon = 'mail', title, description }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="text" accessibilityLabel={title}>
      <Icon name={icon} size={48} color={colors.onSurfaceVariant} />
      <Text variant="headlineSmall" color="onSurfaceVariant" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="bodyMedium" color="outline" style={styles.description}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', maxWidth: 280 },
});
