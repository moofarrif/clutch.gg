import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radii } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        active ? styles.active : styles.inactive,
      ]}
      activeOpacity={0.7}
    >
      <Text
        variant="labelSmall"
        color={active ? 'onPrimaryFixed' : 'onSurface'}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  active: {
    backgroundColor: colors.primaryContainer,
  },
  inactive: {
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '33',
  },
});
