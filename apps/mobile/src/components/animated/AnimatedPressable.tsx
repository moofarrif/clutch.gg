import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptic } from '../../hooks/useHaptic';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

interface AnimatedPressableProps extends PressableProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
  haptic?: 'light' | 'medium' | 'selection' | false;
}

export function AnimatedPressable({
  children,
  style,
  scaleDown = 0.96,
  haptic = 'light',
  onPress,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const triggerHaptic = useHaptic();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      onPressIn={() => {
        scale.value = withSpring(scaleDown, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      onPress={(e) => {
        if (haptic) triggerHaptic(haptic);
        onPress?.(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
}
