import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms/Text';
import { AnimatedPressable } from '../animated';
import { colors, spacing } from '../../theme';
import { fontMap } from '../../theme/fonts';
import type { ColorToken } from '../../theme';

interface SectionHeaderProps {
  title: string;
  titleColor?: ColorToken;
  subtitle?: string;
  rightLabel?: string;
  onRightPress?: () => void;
}

export function SectionHeader({
  title,
  titleColor = 'onSurface',
  subtitle,
  rightLabel,
  onRightPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text
          style={[styles.title, { color: colors[titleColor] }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
      {rightLabel && onRightPress && (
        <AnimatedPressable
          onPress={onRightPress}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={rightLabel}
        >
          <Text style={styles.rightLabel}>{rightLabel}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  rightLabel: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
