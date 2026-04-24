import { type ReactNode, useImperativeHandle, forwardRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptic } from '../../hooks/useHaptic';

export interface ShakeRef {
  shake: () => void;
}

interface ShakeViewProps {
  children: ReactNode;
}

export const ShakeView = forwardRef<ShakeRef, ShakeViewProps>(({ children }, ref) => {
  const translateX = useSharedValue(0);
  const haptic = useHaptic();

  useImperativeHandle(ref, () => ({
    shake: () => {
      haptic('error');
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});
