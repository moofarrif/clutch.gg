import { Tabs } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, withOpacity } from '../../theme';
import { Icon } from '../../components/atoms';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];

const SPRING = { damping: 15, stiffness: 150, mass: 0.8 };

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = focused
      ? withSpring(1.15, { damping: 8, stiffness: 300 })
      : withSpring(1, SPRING);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 48, height: 36 }}>
      <Animated.View style={iconStyle}>
        <Icon name={name} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabWidth = width / 3;
  const indicatorX = useSharedValue(tabWidth / 2 - 12);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surfaceContainer,
            borderTopWidth: 0,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.primaryContainer,
          tabBarInactiveTintColor: colors.outline,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarItemStyle: { paddingVertical: 8 },
        }}
      >
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color, focused }) => <TabIcon name="search" color={color} focused={focused} />,
          }}
          listeners={{ focus: () => { indicatorX.value = withSpring(0 * tabWidth + tabWidth / 2 - 12, SPRING); } }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            tabBarIcon: ({ color, focused }) => <TabIcon name="soccer" color={color} focused={focused} />,
          }}
          listeners={{ focus: () => { indicatorX.value = withSpring(1 * tabWidth + tabWidth / 2 - 12, SPRING); } }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
          }}
          listeners={{ focus: () => { indicatorX.value = withSpring(2 * tabWidth + tabWidth / 2 - 12, SPRING); } }}
        />
      </Tabs>

      {/* Sliding indicator */}
      <Animated.View
        style={[{
          position: 'absolute',
          bottom: insets.bottom + 52,
          left: 0,
          width: 24,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.primaryContainer,
        }, indicatorStyle]}
        pointerEvents="none"
      />
    </View>
  );
}
