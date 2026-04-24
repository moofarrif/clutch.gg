import { View, StyleSheet } from 'react-native';
import { colors, radii, type ColorToken } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: ColorToken;
  bgColor?: ColorToken;
  height?: number;
}

export function ProgressBar({
  progress,
  color = 'primaryContainer',
  bgColor = 'surfaceContainerHighest',
  height = 6,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { backgroundColor: colors[bgColor], height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors[color],
            width: `${clampedProgress * 100}%`,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
