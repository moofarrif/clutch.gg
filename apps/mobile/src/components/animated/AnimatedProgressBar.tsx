import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme';

interface AnimatedProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

const SPRING = { damping: 14, stiffness: 180, mass: 0.5 };

export function AnimatedProgressBar({
  progress,
  color = colors.primaryContainer,
  trackColor = colors.surfaceContainerHighest,
  height = 6,
}: AnimatedProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress)), SPRING);
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round((isNaN(progress) ? 0 : progress) * 100), min: 0, max: 100 }}
    >
      <Animated.View
        style={[
          styles.fill,
          { height, borderRadius: height / 2, backgroundColor: color },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
