import { View, Image, StyleSheet } from 'react-native';
import { colors, type ColorToken } from '../../theme';

interface AvatarProps {
  uri?: string;
  size?: number;
  borderColor?: ColorToken;
}

export function Avatar({ uri, size = 48, borderColor = 'secondary' }: AvatarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors[borderColor],
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.surfaceContainerHighest,
  },
});
