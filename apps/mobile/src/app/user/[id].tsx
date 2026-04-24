import { View, Text as RNText, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRankForMmr } from '@clutch/shared';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { Card, Icon, EmptyState } from '../../components/atoms';
import { AnimatedPressable, AnimatedCounter } from '../../components/animated';
import { usePublicProfile } from '../../hooks/useProfile';
import { useFriends, useSendFriendRequest, useRemoveFriend } from '../../hooks/useFriends';
import { useAuthStore } from '../../stores/auth';

function getConductLabel(score: number): string {
  if (score >= 4) return 'Elite Certificado';
  if (score >= 3) return 'Buen Deportista';
  return 'En Progreso';
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user, isLoading, error } = usePublicProfile(id);
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  const { data: friends } = useFriends();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isSelf = id === currentUserId;
  const friendship = friends?.find((f) => f.friendId === id);
  const isFriend = !!friendship;

  const rank = getRankForMmr(user?.mmr ?? 0);
  const conductScore = user?.conductScore ?? 0;
  const conductLabel = getConductLabel(conductScore);
  const winRate = user?.matchesPlayed
    ? ((user.wins ?? 0) / user.matchesPlayed * 100).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
        <View style={styles.backRow}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={styles.backButton}>
            <Icon name="back" size={22} color={colors.onSurface} />
          </AnimatedPressable>
        </View>
        <EmptyState icon="person" title="Usuario no encontrado" description="Este perfil no existe o fue eliminado." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Back button */}
        <View style={styles.backRow}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={styles.backButton}>
            <Icon name="back" size={22} color={colors.onSurface} />
          </AnimatedPressable>
        </View>

        {/* Avatar + Name + Rank */}
        <View style={styles.heroSection}>
          <View style={styles.avatarRing}>
            {user.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <RNText style={styles.avatarInitial}>{user.name.charAt(0)}</RNText>
              </View>
            )}
          </View>

          <RNText style={styles.username} accessibilityRole="header">{user.name}</RNText>

          {user.city ? (
            <View style={styles.cityRow}>
              <Icon name="location" size={14} color={colors.onSurfaceVariant} />
              <RNText style={styles.cityText}>{user.city}</RNText>
            </View>
          ) : null}

          <View style={[styles.rankBadge, { backgroundColor: withOpacity(rank.color, 0.15) }]}>
            <Icon name="shield-fill" size={14} color={rank.color} />
            <RNText style={[styles.rankText, { color: rank.color }]}>{rank.label}</RNText>
          </View>
        </View>

        {/* ELO Rating */}
        <Card surface="container" padding="xl" style={styles.eloCard}>
          <View style={styles.eloRow}>
            <View>
              <RNText style={styles.eloLabel}>ELO Rating</RNText>
              <AnimatedCounter value={user.mmr} style={styles.eloValue} />
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card surface="containerHighest" padding="lg" style={styles.statCard}>
            <RNText style={styles.statLabel}>Win Rate</RNText>
            <RNText style={[styles.statValue, { color: colors.primaryContainer }]}>{winRate}%</RNText>
          </Card>

          <Card surface="containerHighest" padding="lg" style={styles.statCard}>
            <RNText style={styles.statLabel}>Partidos</RNText>
            <RNText style={[styles.statValue, { color: colors.secondary }]}>{user.matchesPlayed ?? 0}</RNText>
            <RNText style={styles.statSub}>{user.wins ?? 0}V / {user.losses ?? 0}D</RNText>
          </Card>

          <Card surface="containerHighest" padding="lg" style={styles.statCard}>
            <RNText style={styles.statLabel}>Conducta</RNText>
            <View style={styles.conductStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name={i < Math.floor(conductScore) ? 'star' : 'star-outline'}
                  size={16}
                  color={i < Math.floor(conductScore) ? colors.tertiaryContainer : colors.outlineVariant}
                />
              ))}
            </View>
            <RNText style={styles.statSub}>{conductLabel}</RNText>
          </Card>
        </View>

        {/* Add/Remove Friend Button / Self indicator */}
        {isSelf ? (
          <RNText style={styles.selfLabel}>Tu perfil</RNText>
        ) : isFriend ? (
          <>
            <AnimatedPressable
              onPress={() => removeFriend.mutate(friendship.friendshipId)}
              haptic="medium"
              style={[styles.removeFriendButton, removeFriend.isPending && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Eliminar amigo"
              disabled={removeFriend.isPending}
            >
              <Icon name="people" size={20} color={colors.error} />
              <RNText style={styles.removeFriendText}>
                {removeFriend.isPending ? 'Eliminando...' : 'Eliminar amigo'}
              </RNText>
            </AnimatedPressable>

            {removeFriend.isError ? (
              <RNText style={styles.errorText}>No se pudo eliminar al amigo</RNText>
            ) : null}
          </>
        ) : (
          <>
            <AnimatedPressable
              onPress={() => sendRequest.mutate(id)}
              haptic="medium"
              style={[styles.addFriendButton, sendRequest.isPending && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Agregar amigo"
              disabled={sendRequest.isPending || sendRequest.isSuccess}
            >
              <Icon name="people" size={20} color={colors.onSurface} />
              <RNText style={styles.addFriendText}>
                {sendRequest.isSuccess ? 'Solicitud enviada' : sendRequest.isPending ? 'Enviando...' : 'Agregar amigo'}
              </RNText>
            </AnimatedPressable>

            {sendRequest.isError ? (
              <RNText style={styles.errorText}>No se pudo enviar la solicitud</RNText>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, gap: spacing.xl },

  // Back
  backRow: { flexDirection: 'row' },
  backButton: {
    backgroundColor: colors.surfaceContainerHighest,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroSection: { alignItems: 'center', gap: spacing.sm },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 32,
    fontWeight: '700',
    color: colors.onSurface,
  },
  username: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 26,
    fontWeight: '700',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  rankText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ELO card
  eloCard: {
    borderWidth: 1,
    borderColor: withOpacity(colors.secondary, 0.2),
  },
  eloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eloLabel: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  eloValue: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 40,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 48,
    color: colors.secondary,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    gap: spacing.sm,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  statLabel: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  statSub: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  conductStars: { flexDirection: 'row', gap: 2 },

  // Add friend button
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  removeFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  removeFriendText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonDisabled: { opacity: 0.5 },
  addFriendText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },
  selfLabel: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 13,
    fontWeight: '700',
    color: colors.outline,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
