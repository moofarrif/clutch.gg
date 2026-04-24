import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radii, type ColorToken } from '../../theme';

interface BadgeProps {
  label: string;
  bg?: ColorToken;
  textColor?: ColorToken;
}

export function Badge({ label, bg = 'primaryContainer', textColor = 'onPrimaryContainer' }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors[bg] }]}>
      <Text variant="labelSmall" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
});
