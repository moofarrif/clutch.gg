import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radii, fontFamilies } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="labelSmall" color="onSurfaceVariant" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.outline + '80'}
        selectionColor={colors.secondary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurface,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
});
