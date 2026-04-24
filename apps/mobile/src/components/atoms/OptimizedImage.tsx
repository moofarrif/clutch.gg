import { Image, type ImageStyle } from 'expo-image';
import { colors } from '../../theme';

interface OptimizedImageProps {
  uri: string | null | undefined;
  size: number;
  style?: ImageStyle;
  borderRadius?: number;
}

// Cloudinary URL transformation helper
// Converts: https://res.cloudinary.com/.../upload/v123/clutch/avatars/abc.webp
// To:       https://res.cloudinary.com/.../upload/w_200,h_200,c_fill,q_auto/v123/clutch/avatars/abc.webp
function getOptimizedUrl(uri: string, width: number): string {
  if (uri.includes('res.cloudinary.com') && uri.includes('/upload/')) {
    return uri.replace('/upload/', `/upload/w_${width},h_${width},c_fill,q_auto,f_webp/`);
  }
  return uri;
}

export function OptimizedImage({ uri, size, style, borderRadius }: OptimizedImageProps) {
  const resolvedRadius = borderRadius ?? size / 2;

  if (!uri) {
    return (
      <Image
        style={[
          {
            width: size,
            height: size,
            borderRadius: resolvedRadius,
            backgroundColor: colors.surfaceContainerHighest,
          },
          style,
        ]}
        contentFit="cover"
      />
    );
  }

  // Request size based on display size (2x for retina)
  const requestSize = Math.min(size * 2, 800);
  const optimizedUri = getOptimizedUrl(uri, requestSize);

  return (
    <Image
      source={{ uri: optimizedUri }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: resolvedRadius,
        },
        style,
      ]}
      contentFit="cover"
      transition={200}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}
