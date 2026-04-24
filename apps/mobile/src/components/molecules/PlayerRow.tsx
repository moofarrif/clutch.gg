import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Badge } from '../atoms';
import { colors, radii, spacing, type ColorToken } from '../../theme';

interface PlayerRowProps {
  name: string;
  rank: string;
  photoUri?: string;
  position?: string;
  rankColor?: ColorToken;
  onPress?: () => void;
}

export function PlayerRow({
  name,
  rank,
  photoUri,
  position,
  rankColor = 'secondary',
  onPress,
}: PlayerRowProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Avatar uri={photoUri} size={56} borderColor={rankColor} />
        <View>
          <Text variant="headlineSmall" color="onSurface">
            {name}
          </Text>
          <Text variant="labelSmall" color={rankColor}>
            {rank}
          </Text>
        </View>
      </View>
      {position && (
        <View style={styles.position}>
          <Text variant="labelTiny" color="onSurfaceVariant">
            Position
          </Text>
          <Text variant="headlineSmall" color="primary" italic>
            {position}
          </Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHighest,
    padding: 4,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  position: {
    alignItems: 'flex-end',
    paddingRight: spacing.lg,
  },
});
