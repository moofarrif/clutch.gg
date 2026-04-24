import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useHaptic } from '../../hooks/useHaptic';
import { colors } from '../../theme';
import { Text } from '../atoms';

interface AnimatedStarProps {
  filled: boolean;
  size?: number;
  onPress: () => void;
}

const SPRING = { damping: 10, stiffness: 400, mass: 0.3 };

export function AnimatedStar({ filled, size = 40, onPress }: AnimatedStarProps) {
  const scale = useSharedValue(1);
  const haptic = useHaptic();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, SPRING),
      withSpring(1, SPRING),
    );
    haptic('selection');
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={{
          width: size,
          height: size,
          borderRadius: 2,
          borderCurve: 'continuous',
          backgroundColor: filled ? colors.primaryContainer : colors.surfaceContainer,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel={filled ? 'Estrella llena' : 'Estrella vacía'}
      >
        <Text
          variant="bodyLarge"
          style={{
            fontSize: size * 0.5,
            color: filled ? colors.onPrimary : colors.onSurfaceVariant,
          }}
        >
          ★
        </Text>
      </Pressable>
    </Animated.View>
  );
}
