import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms';
import { spacing } from '../../theme';

interface EloChangeProps {
  delta: number;
}

export function EloChange({ delta }: EloChangeProps) {
  const isPositive = delta > 0;
  const color = isPositive ? 'primaryContainer' : delta < 0 ? 'error' : 'onSurfaceVariant';
  const prefix = isPositive ? '+' : '';

  return (
    <View style={styles.container}>
      <Text variant="labelSmall" color={color}>
        {prefix}{delta} ELO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
