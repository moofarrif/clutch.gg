import { type ReactNode } from 'react';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';

interface StaggeredItemProps {
  children: ReactNode;
  index: number;
  direction?: 'up' | 'down';
  delay?: number;
}

export function StaggeredItem({
  children,
  index,
  direction = 'up',
  delay = 50,
}: StaggeredItemProps) {
  const entering = direction === 'up'
    ? FadeInUp.delay(index * delay).duration(250).springify().damping(14).stiffness(200)
    : FadeInDown.delay(index * delay).duration(250).springify().damping(14).stiffness(200);

  return (
    <Animated.View entering={entering} layout={Layout.springify().damping(16)}>
      {children}
    </Animated.View>
  );
}
