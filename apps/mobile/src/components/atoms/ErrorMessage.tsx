import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radii } from '../../theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text variant="bodyMedium" color="error" style={styles.message} selectable>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
        >
          <Text variant="labelSmall" color="onSurface">Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorContainer,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    gap: spacing.md,
    alignItems: 'center',
  },
  message: { textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
});
