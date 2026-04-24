import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms';
import { colors, radii, spacing } from '../../theme';

interface EmptySlotProps {
  slotNumber: number;
  label?: string;
}

export function EmptySlot({ slotNumber, label = 'Public Slot' }: EmptySlotProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Text variant="bodyLarge" color="outline">+</Text>
        </View>
        <Text variant="headlineSmall" color="outline">
          Slot {String(slotNumber).padStart(2, '0')} Open
        </Text>
      </View>
      <Text variant="labelSmall" color="outlineVariant">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant + '4D',
    padding: spacing.lg,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
