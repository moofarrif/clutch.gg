import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchDetail, useRateConduct } from '../../../hooks/useMatches';
import { useAuthStore } from '../../../stores/auth';
import { useMatchHistory } from '../../../hooks/useProfile';
import { AnimatedPressable, AnimatedCounter, AnimatedProgressBar, AnimatedStar, StaggeredItem, SuccessCheck } from '../../../components/animated';
import { Icon } from '../../../components/atoms';
import { useState } from 'react';
import { getErrorMessage } from '../../../utils/api-error';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../../theme';
import { getRankForMmr, RANKS } from '@clutch/shared';

export default function RateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: match } = useMatchDetail(id as string);
  const rateConductMutation = useRateConduct();
  const user = useAuthStore((s) => s.user);
  const myUserId = user?.id;
  const { data: history } = useMatchHistory();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // ELO change from match history
  const eloEntry = (history ?? []).find((h) => h.matchId === id);
  const eloDelta = eloEntry ? eloEntry.mmrAfter - eloEntry.mmrBefore : null;
  const won = eloDelta !== null ? eloDelta > 0 : null;

  // Current rank & progress towards next tier
  const currentMmr = user?.mmr ?? 0;
  const currentRank = getRankForMmr(currentMmr);
  const rankValues = Object.values(RANKS);
  const currentRankIndex = rankValues.findIndex((r) => r.name === currentRank.name);
  const nextRank = currentRankIndex < rankValues.length - 1 ? rankValues[currentRankIndex + 1] : null;
  const tierFloor = currentRank.minMmr;
  const tierCeiling = nextRank ? nextRank.minMmr : currentRank.minMmr;
  const tierRange = tierCeiling - tierFloor;
  const tierProgress = tierRange > 0 ? Math.min(1, Math.max(0, (currentMmr - tierFloor) / tierRange)) : 1;

  // Team name for badge
  // Derive teammates: same team as current user, excluding self
  const myPlayer = match?.players.find((p) => p.userId === myUserId);
  const teammates = (match?.players ?? []).filter(
    (p) => p.userId !== myUserId && p.team === myPlayer?.team
  );

  const handleRate = (userId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [userId]: score }));
  };

  return (
    <View style={styles.root}>
      {/* Top App Bar */}
      <View
        style={[
          styles.appBar,
          { height: 64 + insets.top, paddingTop: insets.top },
        ]}
        accessibilityRole="header"
      >
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <Icon name="back" size={22} color={colors.primaryContainer} />
          <Text style={styles.appBarTitle}>RESULTADOS DEL PARTIDO</Text>
        </AnimatedPressable>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel="Ayuda">
          <Icon name="info-circle" size={20} color={colors.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Victory Card */}
        <View style={styles.victoryCard} accessibilityLabel={eloDelta !== null ? `Progreso de ${won ? 'victoria' : 'derrota'}: ${eloDelta > 0 ? 'más' : 'menos'} ${Math.abs(eloDelta)} ELO` : 'Progreso de partido'}>
          {/* Glow */}
          <View style={styles.victoryGlow} />

          <Text style={styles.victoryLabel}>{won ? 'Progreso de Victoria' : won === false ? 'Resultado de Derrota' : 'Resultado del Partido'}</Text>

          {eloDelta !== null ? (
            <View style={styles.victoryEloRow}>
              <AnimatedCounter value={Math.abs(eloDelta)} prefix={eloDelta >= 0 ? '+' : '-'} style={styles.victoryEloNumber} />
              <Text style={styles.victoryEloUnit}>ELO</Text>
            </View>
          ) : (
            <View style={styles.victoryEloRow}>
              <Text style={styles.victoryEloNumber}>--</Text>
              <Text style={styles.victoryEloUnit}>ELO</Text>
            </View>
          )}

          {/* Rating info */}
          <View style={styles.ratingInfoRow}>
            <Text style={styles.ratingInfoLabel}>Rating Actual</Text>
            <Text style={styles.ratingInfoValue}>{currentMmr.toLocaleString()} ({currentRank.label})</Text>
          </View>

          {/* Progress bar */}
          <AnimatedProgressBar progress={tierProgress} height={8} />

          {/* Range labels */}
          <View style={styles.progressLabelsRow}>
            <Text style={styles.progressLabel}>{tierFloor.toLocaleString()}</Text>
            <Text style={styles.progressLabel}>{nextRank ? `${tierCeiling.toLocaleString()} SIGUIENTE RANGO` : 'RANGO MAXIMO'}</Text>
          </View>
        </View>

        {/* Mini Stats */}
        <View style={styles.statsRow}>
          {/* Stat 1 */}
          <StaggeredItem index={0}>
            <View style={styles.statCard} accessibilityLabel={`Partidos jugados: ${user?.matchesPlayed ?? 0}, rango ${currentRank.label}`}>
              <Text style={styles.statLabel}>Partidos Jugados</Text>
              <Text style={styles.statValue}>{(user?.matchesPlayed ?? 0).toLocaleString()}</Text>
              <Text style={styles.statHighlight}>{'↑ ' + currentRank.label.toUpperCase()}</Text>
            </View>
          </StaggeredItem>

          {/* Stat 2 */}
          <StaggeredItem index={1}>
            <View style={styles.statCard} accessibilityLabel={`Victorias: ${user?.wins ?? 0}`}>
              <Text style={styles.statLabel}>Victorias</Text>
              <Text style={styles.statValue}>{user?.wins ?? 0}</Text>
              {(user?.wins ?? 0) > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="flame" size={12} color={colors.primaryContainer} />
                  <Text style={styles.statStreakHighlight}>EN RACHA</Text>
                </View>
              ) : null}
            </View>
          </StaggeredItem>
        </View>

        {/* Rate Teammates Section */}
        <View style={styles.rateSection}>
          <Text style={styles.rateSectionTitle} accessibilityRole="header">
            Califica a Tus Companeros
          </Text>
          <Text style={styles.rateSectionDesc}>
            Tu calificacion ayuda a mejorar el matchmaking para todos.
          </Text>

          {/* Team Badge */}
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>{myPlayer?.team ? `Equipo ${myPlayer.team}` : 'Equipo'}</Text>
          </View>

          {/* Player Rating Rows */}
          <View style={styles.teammateList}>
            {teammates.map((teammate) => (
              <View
                key={teammate.userId}
                style={styles.teammateCard}
                accessibilityLabel={`${teammate.user.name}, ${teammate.team}, MMR ${teammate.user.mmr}`}
              >
                <View style={styles.teammateTopRow}>
                  {/* Left: Avatar + Info */}
                  <View style={styles.teammateLeft}>
                    {/* Avatar */}
                    <View style={styles.teammateAvatarWrap}>
                      <View style={styles.teammateAvatar}>
                        <Text style={styles.teammateAvatarText}>
                          {teammate.user.name.charAt(0)}
                        </Text>
                      </View>
                      {/* Rank icon badge */}
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Icon name="star" size={10} color={colors.background} />
                      </View>
                    </View>
                    <View>
                      <Text style={styles.teammateName}>{teammate.user.name}</Text>
                      <Text style={styles.teammateRole}>
                        {teammate.team ?? 'Jugador'} {'·'} MMR {teammate.user.mmr}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stars + Report Row */}
                <View style={styles.starsRow}>
                  {/* Stars */}
                  <View style={styles.starsGroup}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (ratings[teammate.userId] ?? 0) >= star;
                      return (
                        <AnimatedStar
                          key={star}
                          filled={isActive}
                          size={40}
                          onPress={() => handleRate(teammate.userId, star)}
                        />
                      );
                    })}
                  </View>

                  {/* Vertical Divider */}
                  <View style={styles.verticalDivider} />

                  {/* Report Button */}
                  <AnimatedPressable
                    style={styles.reportButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Reportar a ${teammate.user.name}`}
                  >
                    <Icon name="warning" size={14} color={colors.errorDim} />
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsGroup}>
          {/* Primary: Listo */}
          <AnimatedPressable
            onPress={() => {
              rateConductMutation.mutate({
                matchId: id as string,
                ratings: Object.entries(ratings).map(([userId, score]) => ({ userId, score })),
              }, {
                onSuccess: () => setShowSuccess(true),
                onError: async (error: unknown) => {
                  const msg = await getErrorMessage(error);
                  Alert.alert('Error', msg);
                },
              });
            }}
            disabled={rateConductMutation.isPending}
            style={[buttonStyles.primary, shadow('ctaLime')]}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Listo, ir a perfil"
          >
            {rateConductMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={buttonStyles.primaryText}>LISTO</Text>
            )}
          </AnimatedPressable>

          {/* Secondary: Ver Estadisticas */}
          <AnimatedPressable
            style={buttonStyles.ghost}
            accessibilityRole="button"
            accessibilityLabel="Ver estadísticas detalladas"
          >
            <Text style={buttonStyles.ghostText}>
              Ver Estadisticas Detalladas
            </Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
      <SuccessCheck visible={showSuccess} message="¡Calificación enviada!" onDone={() => { setShowSuccess(false); router.replace('/(tabs)/profile'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },

  /* App Bar */
  appBar: {
    backgroundColor: withOpacity(colors.background, 0.7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backArrow: {
    color: colors.primaryContainer,
    fontSize: 22,
    fontWeight: '700',
  },
  appBarTitle: {
    color: colors.primaryContainer,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  helpIcon: {
    fontSize: 20,
  },

  /* Victory Card */
  victoryCard: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing['2xl'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    position: 'relative',
    overflow: 'hidden',
  },
  victoryGlow: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: colors.secondary,
    opacity: 0.1,
  },
  victoryLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 3.2,
  },
  victoryEloRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  victoryEloNumber: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 56,
    fontStyle: 'italic',
    lineHeight: 64,
    color: colors.onSurface,
  },
  victoryEloUnit: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 56,
    fontStyle: 'italic',
    lineHeight: 64,
    color: colors.primaryContainer,
    marginLeft: spacing.sm,
  },
  ratingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  ratingInfoLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  ratingInfoValue: {
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: colors.onSurface,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    width: '72%',
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },

  /* Mini Stats */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.xl,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    borderLeftWidth: 2,
    borderLeftColor: withOpacity(colors.secondary, 0.3),
  },
  statLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 30,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  statHighlight: {
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: colors.secondary,
    marginTop: spacing.sm,
  },
  statStreakHighlight: {
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: colors.primaryContainer,
    marginTop: spacing.sm,
  },

  /* Rate Teammates */
  rateSection: {
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing['2xl'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    marginTop: spacing.xl,
  },
  rateSectionTitle: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 24,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  rateSectionDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  teamBadge: {
    alignSelf: 'flex-start',
    backgroundColor: withOpacity(colors.secondary, 0.1),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginTop: spacing.lg,
  },
  teamBadgeText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  teammateList: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  teammateCard: {
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
  },
  teammateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teammateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  teammateAvatarWrap: {
    position: 'relative',
  },
  teammateAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teammateAvatarText: {
    color: colors.onSurfaceVariant,
    fontSize: 20,
    fontWeight: '700',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeStar: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '900',
  },
  teammateName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  teammateRole: {
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  starsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starButton: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    backgroundColor: colors.primaryContainer,
  },
  starButtonInactive: {
    backgroundColor: colors.surfaceContainer,
  },
  starIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 2,
    height: 32,
    backgroundColor: colors.outlineVariant,
    opacity: 0.2,
    marginHorizontal: spacing.xs,
  },
  reportButton: {
    padding: spacing.sm,
  },
  reportIcon: {
    color: colors.errorDim,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Buttons */
  buttonsGroup: {
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  primaryButtonText: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 18,
    color: colors.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceContainer,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withOpacity(colors.outlineVariant, 0.1),
  },
  secondaryButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
});
