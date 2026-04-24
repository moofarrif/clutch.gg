import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from '../atoms';
import { colors, radii, spacing, type ColorToken } from '../../theme';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  progress?: number;
  progressColor?: ColorToken;
  valueColor?: ColorToken;
}

export function StatCard({
  label,
  value,
  subtitle,
  progress,
  progressColor = 'primaryContainer',
  valueColor = 'primary',
}: StatCardProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelSmall" color="onSurfaceVariant">
        {label}
      </Text>
      <View style={styles.bottom}>
        <Text variant="headlineLarge" color={valueColor} italic>
          {value}
        </Text>
        {subtitle && (
          <Text variant="labelSmall" color="onSurfaceVariant">
            {subtitle}
          </Text>
        )}
        {progress !== undefined && (
          <ProgressBar progress={progress} color={progressColor} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHighest,
    padding: spacing.lg,
    borderRadius: radii.lg,
    justifyContent: 'space-between',
    minHeight: 128,
    gap: spacing.sm,
  },
  bottom: {
    gap: spacing.sm,
  },
});
