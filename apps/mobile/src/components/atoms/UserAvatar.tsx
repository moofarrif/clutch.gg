import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '../../theme';

interface UserAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: number;
  borderColor?: string;
}

export function UserAvatar({ photoUrl, name, size = 40, borderColor }: UserAvatarProps) {
  const radius = size / 2;
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: borderColor ?? 'transparent',
          borderWidth: borderColor ? 2 : 0,
        },
      ]}
    >
      {photoUrl ? (
        <ExpoImage
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text style={[styles.initial, { fontSize }]}>
          {name?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
});
