import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useHaptic } from '../../hooks/useHaptic';
import { colors } from '../../theme';

interface SuccessCheckProps {
  visible: boolean;
  onDone?: () => void;
  message?: string;
}

export function SuccessCheck({ visible, onDone, message = '¡Listo!' }: SuccessCheckProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const haptic = useHaptic();

  useEffect(() => {
    if (visible) {
      haptic('success');
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      checkScale.value = withDelay(200,
        withSpring(1, { damping: 10, stiffness: 250 }),
      );

      // Auto dismiss after 1.5s
      if (onDone) {
        const timer = setTimeout(onDone, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = 0;
      checkScale.value = 0;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.Text style={[styles.check, checkStyle]}>✓</Animated.Text>
      </Animated.View>
      <Animated.Text style={[styles.message, checkStyle]}>{message}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 14, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    fontSize: 48,
    color: colors.onPrimary,
    fontWeight: '900',
  },
  message: {
    marginTop: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
});
