import { View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, spacing, radii } from '../../theme';
import type { SpacingToken, RadiusToken } from '../../theme';

const SURFACE_MAP = {
  container: colors.surfaceContainer,
  containerLow: colors.surfaceContainerLow,
  containerHigh: colors.surfaceContainerHigh,
  containerHighest: colors.surfaceContainerHighest,
} as const;

type SurfaceVariant = keyof typeof SURFACE_MAP;

interface CardProps extends ViewProps {
  surface?: SurfaceVariant;
  padding?: SpacingToken;
  radius?: RadiusToken;
  borderColor?: string;
  borderWidth?: number;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Card({
  surface = 'container',
  padding = 'lg',
  radius = 'lg',
  borderColor,
  borderWidth,
  children,
  style,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: SURFACE_MAP[surface],
          borderRadius: radii[radius],
          borderCurve: 'continuous',
          padding: spacing[padding],
          overflow: 'hidden',
        },
        borderColor ? { borderColor, borderWidth: borderWidth ?? 1 } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
