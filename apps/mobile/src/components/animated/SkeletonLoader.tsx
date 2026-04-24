import { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, radii } from '../../theme';

interface SkeletonLoaderProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = radii.md,
  style,
}: SkeletonLoaderProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          borderCurve: 'continuous',
          backgroundColor: colors.surfaceContainerHighest,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando..."
    />
  );
}

// Pre-built skeleton layouts
export function MatchCardSkeleton() {
  return (
    <View style={skeletonStyles.matchCard}>
      <SkeletonLoader width="100%" height={128} borderRadius={radii.sm} />
      <View style={skeletonStyles.matchCardBody}>
        <SkeletonLoader width="70%" height={24} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: 8 }} />
        <View style={skeletonStyles.matchCardFooter}>
          <SkeletonLoader width="60%" height={6} borderRadius={9999} />
          <SkeletonLoader width={90} height={32} borderRadius={9999} />
        </View>
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.profile}>
      <SkeletonLoader width={132} height={132} borderRadius={66} />
      <SkeletonLoader width={160} height={28} style={{ marginTop: 16 }} />
      <SkeletonLoader width={100} height={48} style={{ marginTop: 8 }} />
      <View style={skeletonStyles.profileStats}>
        <SkeletonLoader width="48%" height={128} borderRadius={radii.lg} />
        <SkeletonLoader width="48%" height={128} borderRadius={radii.lg} />
      </View>
    </View>
  );
}

export function MatchRowSkeleton() {
  return (
    <View style={skeletonStyles.matchRowCard}>
      <SkeletonLoader width="40%" height={28} />
      <SkeletonLoader width="30%" height={28} />
      <SkeletonLoader width="60%" height={14} style={{ marginTop: 12 }} />
      <View style={skeletonStyles.matchRowFooter}>
        <SkeletonLoader width={80} height={16} />
        <SkeletonLoader width={100} height={36} borderRadius={9999} />
      </View>
    </View>
  );
}

export function LeaderboardSkeleton() {
  return (
    <View style={skeletonStyles.leaderboard}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={skeletonStyles.rankRow}>
          <SkeletonLoader width={28} height={20} />
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width="40%" height={16} />
          <SkeletonLoader width={60} height={16} />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  matchCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
    gap: 16,
  },
  matchCardBody: {
    padding: 20,
    gap: 4,
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  profile: {
    alignItems: 'center',
    gap: 4,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  matchRowCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: 20,
    gap: 8,
  },
  matchRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 14,
  },
  leaderboard: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
  },
});
