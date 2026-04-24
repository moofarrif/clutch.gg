import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text, Icon } from '../atoms';
import { AnimatedPressable, AnimatedProgressBar } from '../animated';
import { colors, spacing, radii, withOpacity } from '../../theme';

interface MatchCardProps {
  courtName: string;
  courtPhoto?: string | null;
  time: string;
  playersJoined: number;
  maxPlayers: number;
  distance?: string;
  onPress?: () => void;
  onJoin?: () => void;
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=300&fit=crop';

export function MatchCard({
  courtName,
  courtPhoto,
  time,
  playersJoined,
  maxPlayers,
  distance,
  onPress,
}: MatchCardProps) {
  const progress = maxPlayers > 0 ? playersJoined / maxPlayers : 0;
  const spotsLeft = maxPlayers - playersJoined;
  const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
  const isFull = spotsLeft === 0;

  const progressColor = isFull
    ? colors.secondary
    : isAlmostFull
      ? colors.error
      : colors.primaryContainer;

  const spotsLabel = isFull
    ? 'Completo'
    : isAlmostFull
      ? `¡${spotsLeft} lugar${spotsLeft > 1 ? 'es' : ''}!`
      : `${spotsLeft} lugares`;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.card}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`${courtName}, ${playersJoined} de ${maxPlayers} jugadores, ${time}`}
    >
      {/* Court photo */}
      <View style={styles.imageWrap}>
        <ExpoImage
          source={{ uri: courtPhoto || DEFAULT_PHOTO }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Gradient overlay */}
        <View style={styles.imageGradient} />

        {/* Distance badge */}
        {distance && (
          <View style={styles.distanceBadge}>
            <Icon name="location" size={10} color={colors.onSurface} />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}

        {/* Time badge */}
        <View style={styles.timeBadge}>
          <Icon name="time" size={10} color={colors.primaryContainer} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.courtName} numberOfLines={1}>{courtName}</Text>
          <View style={styles.playerCount}>
            <Text style={[styles.playerCountNum, { color: progressColor }]}>
              {playersJoined}<Text style={styles.playerCountMax}>/{maxPlayers}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <AnimatedProgressBar
            progress={progress}
            color={progressColor}
            trackColor={colors.surfaceContainerHighest}
            height={4}
          />
          <Text style={[styles.spotsLabel, {
            color: isFull ? colors.secondary : isAlmostFull ? colors.error : colors.outline,
          }]}>
            {spotsLabel}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },

  // Image
  imageWrap: {
    height: 100,
    backgroundColor: colors.surfaceContainerHighest,
    position: 'relative',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  distanceBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  distanceText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 1,
  },
  timeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withOpacity(colors.background, 0.8),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  timeText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 0.5,
  },

  // Content
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  playerCountNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  playerCountMax: {
    fontSize: 13,
    fontStyle: 'normal',
    color: colors.outline,
  },
  bottomRow: {
    gap: 6,
  },
  spotsLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'right',
  },
});
