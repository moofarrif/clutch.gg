import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface DividerProps {
  vertical?: boolean;
}

export function Divider({ vertical }: DividerProps) {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.outlineVariant + '4D',
    width: '100%',
  },
  vertical: {
    width: 1,
    backgroundColor: colors.outlineVariant + '4D',
    alignSelf: 'stretch',
  },
});
