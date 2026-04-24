import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Badge } from '../atoms';
import { colors, radii, spacing, type ColorToken } from '../../theme';

interface SquadCardProps {
  name: string;
  region: string;
  avgMmr: number;
  winRate: string;
  activity: string;
  slotsAvailable: number;
  totalSlots: number;
  bannerUri?: string;
  isVerified?: boolean;
  tierColor?: ColorToken;
  onJoin?: () => void;
  onPress?: () => void;
}

export function SquadCard({
  name,
  region,
  avgMmr,
  winRate,
  activity,
  slotsAvailable,
  totalSlots,
  bannerUri,
  isVerified,
  tierColor = 'secondary',
  onJoin,
  onPress,
}: SquadCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, isVerified && { borderTopWidth: 2, borderTopColor: colors.secondary }]}
    >
      {/* Banner */}
      <View style={styles.banner}>
        {bannerUri && (
          <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
        )}
        <View style={styles.bannerOverlay} />
        <View style={styles.slotsBadge}>
          <Text variant="labelSmall" color={tierColor}>
            {slotsAvailable} / {totalSlots} SLOTS
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text variant="headlineMedium" color="onSurface" italic>{name}</Text>
              {isVerified && <Text variant="bodyMedium" color="secondary">✓</Text>}
            </View>
            <Text variant="labelSmall" color="outline">{region}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="headlineSmall" color={tierColor}>{avgMmr}</Text>
            <Text variant="labelTiny" color="outline">AVG MMR</Text>
          </View>
        </View>

        {/* Mini stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text variant="labelTiny" color="outline">ACTIVITY</Text>
            <View style={styles.activityRow}>
              <View style={[styles.activityDot, { backgroundColor: colors[tierColor] }]} />
              <Text variant="labelSmall" color="onSurface">{activity}</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <Text variant="labelTiny" color="outline">WIN RATE</Text>
            <Text variant="labelSmall" color="onSurface">{winRate}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={onJoin}
          style={styles.joinBtn}
          activeOpacity={0.8}
        >
          <Text variant="labelSmall" color="onPrimaryFixed">Request to Join</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  banner: { height: 128, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.6 },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  slotsBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,244,254,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,244,254,0.3)',
  },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statsGrid: { flexDirection: 'row', gap: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  joinBtn: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
});
