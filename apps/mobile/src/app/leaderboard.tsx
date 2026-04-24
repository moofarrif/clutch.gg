import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, EmptyState, Icon } from '../components/atoms';
import { UserAvatar } from '../components/atoms';
import { AnimatedCounter, AnimatedPressable, StaggeredItem, LeaderboardSkeleton } from '../components/animated';
import { useLeaderboard } from '../hooks/useProfile';
import { useAuthStore } from '../stores/auth';
import { getRankForMmr, RANKS } from '@clutch/shared';
import { colors, spacing, radii, shadow, withOpacity } from '../theme';
import { getMmrColor } from '../utils/rank-colors';
import { useState } from 'react';

type LeaderboardMode = 'individual' | 'squad';

const ALL_RANKS = [
  { key: 'all', label: 'TODOS', color: colors.primaryContainer },
  { key: 'diamond', label: 'DIAMANTE', color: RANKS.DIAMOND.color },
  { key: 'platinum', label: 'PLATINO', color: RANKS.PLATINUM.color },
  { key: 'gold', label: 'ORO', color: RANKS.GOLD.color },
  { key: 'silver', label: 'PLATA', color: RANKS.SILVER.color },
  { key: 'bronze', label: 'BRONCE', color: RANKS.BRONZE.color },
];

function getTrendIcon(trend: string) {
  if (trend === 'up') return { symbol: '↑', color: colors.primaryContainer };
  if (trend === 'down') return { symbol: '↓', color: colors.error };
  return { symbol: '•', color: colors.outline };
}

/* ─── Segmented Control ─── */

function SegmentedControl({
  mode,
  onChangeMode,
}: {
  mode: LeaderboardMode;
  onChangeMode: (m: LeaderboardMode) => void;
}) {
  return (
    <View style={styles.segmented}>
      <AnimatedPressable
        haptic="selection"
        onPress={() => onChangeMode('individual')}
        style={[styles.segmentTab, mode === 'individual' && styles.segmentTabActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'individual' }}
      >
        <Icon
          name="person"
          size={14}
          color={mode === 'individual' ? colors.background : colors.onSurfaceVariant}
        />
        <Text style={[styles.segmentText, mode === 'individual' && styles.segmentTextActive]}>
          Individual
        </Text>
      </AnimatedPressable>
      <AnimatedPressable
        haptic="selection"
        onPress={() => onChangeMode('squad')}
        style={[styles.segmentTab, mode === 'squad' && styles.segmentTabActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'squad' }}
      >
        <Icon
          name="shield"
          size={14}
          color={mode === 'squad' ? colors.background : colors.onSurfaceVariant}
        />
        <Text style={[styles.segmentText, mode === 'squad' && styles.segmentTextActive]}>
          Squad
        </Text>
      </AnimatedPressable>
    </View>
  );
}

/* ─── Podium ─── */

function PodiumCard({
  data,
  position,
  avatarSize,
  borderColor,
  onPress,
}: {
  data: { id: string; name: string; rank: string; mmr: number; photoUrl: string | null };
  position: number;
  avatarSize: number;
  borderColor: string;
  onPress: () => void;
}) {
  const isFirst = position === 1;

  return (
    <AnimatedPressable
      onPress={onPress}
      haptic="light"
      style={[styles.podiumEntry, isFirst && styles.podiumEntryFirst]}
      accessibilityRole="button"
      accessibilityLabel={`Posición ${position}, ${data.name}, ${data.mmr} MMR`}
    >
      {isFirst && (
        <Icon name="crown" size={24} color={colors.primaryContainer} style={{ marginBottom: 6 }} />
      )}

      <View style={[styles.podiumRing, { borderColor, width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2, borderWidth: isFirst ? 3 : 2 }]}>
        <UserAvatar
          photoUrl={data.photoUrl}
          name={data.name}
          size={avatarSize}
        />
      </View>

      <View style={[styles.posBadge, { backgroundColor: isFirst ? colors.primaryContainer : withOpacity(borderColor, 0.15) }]}>
        <Text style={[styles.posBadgeText, { color: isFirst ? colors.background : borderColor }]}>
          {isFirst ? 'TOP 1' : `#${position}`}
        </Text>
      </View>

      <Text style={[styles.podiumName, { fontSize: isFirst ? 16 : 13 }]} numberOfLines={1}>
        {data.name}
      </Text>
      <Text style={[styles.podiumRankLabel, { color: borderColor }]}>{data.rank}</Text>
      <AnimatedCounter
        value={data.mmr}
        style={[styles.podiumMmr, { fontSize: isFirst ? 20 : 16, color: getMmrColor(data.mmr) }]}
      />
    </AnimatedPressable>
  );
}

/* ─── Ranking Row ─── */

function RankingRow({
  entry,
  onPress,
}: {
  entry: {
    id: string;
    rank: number;
    name: string;
    division: string;
    divisionColor: string;
    mmr: number;
    trend: string;
    isYou?: boolean;
    photoUrl: string | null;
    winRate: string;
  };
  onPress: () => void;
}) {
  const trend = getTrendIcon(entry.trend);
  const isYou = entry.isYou === true;

  return (
    <AnimatedPressable
      onPress={onPress}
      haptic="light"
      style={[styles.rankingRow, isYou && styles.rankingRowYou]}
      accessibilityRole="button"
      accessibilityLabel={`Posición ${entry.rank}, ${entry.name}${isYou ? ' (tú)' : ''}, ${entry.mmr} MMR`}
    >
      <Text style={[styles.rankNumber, isYou && { color: colors.primaryContainer }]}>{entry.rank}</Text>

      <UserAvatar
        photoUrl={entry.photoUrl}
        name={entry.name}
        size={38}
      />

      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>
          {entry.name}
          {isYou && <Text style={styles.rankYouLabel}>{' TÚ'}</Text>}
        </Text>
        <View style={styles.rankMeta}>
          <View style={[styles.rankDot, { backgroundColor: entry.divisionColor }]} />
          <Text style={styles.rankDivision}>{entry.division}</Text>
          <Text style={styles.rankWinRate}>{entry.winRate}</Text>
        </View>
      </View>

      <View style={styles.rankRight}>
        <Text style={[styles.rankMmr, { color: getMmrColor(entry.mmr) }]}>
          {entry.mmr.toLocaleString()}
        </Text>
        <Text style={[styles.rankTrend, { color: trend.color }]}>{trend.symbol}</Text>
      </View>
    </AnimatedPressable>
  );
}

/* ─── Main Screen ─── */

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<LeaderboardMode>('individual');
  const [filter, setFilter] = useState('all');
  const { data: leaderboard, isLoading, refetch, isRefetching } = useLeaderboard(50);
  const myUserId = useAuthStore((s) => s.user?.id);

  // Filter by rank
  const filtered = (leaderboard ?? []).filter((e) => {
    if (filter === 'all') return true;
    const rank = getRankForMmr(e.mmr);
    return rank.name === filter;
  });

  const showPodium = filtered.length >= 3;

  const podium = showPodium
    ? filtered.slice(0, 3).map((e) => ({
        id: e.id,
        name: e.name,
        rank: getRankForMmr(e.mmr).label.toUpperCase(),
        mmr: e.mmr,
        photoUrl: e.photoUrl,
      }))
    : [];

  const listStart = showPodium ? 3 : 0;
  const rankings = filtered.slice(listStart).map((e, i) => {
    const rankData = getRankForMmr(e.mmr);
    const wr = e.matchesPlayed > 0 ? Math.round((e.wins / e.matchesPlayed) * 100) : 0;
    return {
      id: e.id,
      rank: i + listStart + 1,
      name: e.name,
      division: rankData.label,
      divisionColor: rankData.color,
      mmr: e.mmr,
      trend: 'flat' as const,
      isYou: e.id === myUserId,
      photoUrl: e.photoUrl,
      winRate: `${wr}% WR`,
    };
  });

  const podiumEntries = showPodium
    ? [
        { data: podium[1], position: 2, avatarSize: 64, borderColor: colors.secondary },
        { data: podium[0], position: 1, avatarSize: 80, borderColor: colors.primaryContainer },
        { data: podium[2], position: 3, avatarSize: 64, borderColor: colors.tertiaryDim },
      ]
    : [];

  const hasRankings = rankings.length > 0;
  const hasPodium = showPodium;
  const totalPlayers = leaderboard?.length ?? 0;
  const hasResults = filtered.length > 0;

  if (isLoading) {
    return (
      <View style={styles.root}>
        <LeaderboardSkeleton />
      </View>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <View style={styles.root}>
        <EmptyState icon="trophy" title="Sin clasificaciones" description="Aún no hay datos de clasificación disponibles." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* TopAppBar */}
      <View
        style={[styles.appBar, { height: insets.top + 64, paddingTop: insets.top }, shadow('ctaCyan')]}
      >
        <AnimatedPressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Icon name="back" size={24} color={colors.primaryContainer} />
        </AnimatedPressable>
        <Text style={styles.appBarTitle}>Clasificación</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primaryContainer}
            progressViewOffset={insets.top + 64}
          />
        }
      >
        {/* Season header */}
        <View style={styles.seasonHeader}>
          <View>
            <Text style={styles.headerTitle} accessibilityRole="header">Rankings Globales</Text>
            <Text style={styles.headerSubtitle}>Temporada 04: Velocidad Máxima</Text>
          </View>
          <View style={styles.playerCountPill}>
            <Icon name="people" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.playerCountText}>{totalPlayers}</Text>
          </View>
        </View>

        {/* Individual / Squad toggle */}
        <SegmentedControl mode={mode} onChangeMode={setMode} />

        {/* Rank filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {ALL_RANKS.map((f) => {
            const active = filter === f.key;
            return (
              <AnimatedPressable
                key={f.key}
                haptic="selection"
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Filtrar por ${f.label}`}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: f.color }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: withOpacity(f.color, 0.3) },
                ]}
              >
                {f.key !== 'all' && (
                  <View style={[styles.filterDot, { backgroundColor: active ? colors.background : f.color }]} />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? colors.background : f.color },
                  ]}
                >
                  {f.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Squad mode placeholder */}
        {mode === 'squad' ? (
          <View style={styles.squadPlaceholder}>
            <EmptyState
              icon="shield"
              title="Ranking de squads"
              description="Próximamente podrás ver el ranking de los mejores squads."
            />
          </View>
        ) : (
          <>
            {!hasResults ? (
              <View style={styles.emptyFilter}>
                <EmptyState icon="trophy" title="Sin jugadores" description="No hay jugadores en este rango aún." />
              </View>
            ) : (
              <>
                {/* Podium */}
                {hasPodium && (
                  <View style={styles.podiumContainer}>
                    <View style={styles.podiumRow}>
                      {podiumEntries.map((entry, i) => (
                        <StaggeredItem key={entry.data.id} index={i}>
                          <PodiumCard
                            data={entry.data}
                            position={entry.position}
                            avatarSize={entry.avatarSize}
                            borderColor={entry.borderColor}
                            onPress={() => router.push(`/user/${entry.data.id}`)}
                          />
                        </StaggeredItem>
                      ))}
                    </View>

                    <View style={styles.podiumBase}>
                      <View style={[styles.podiumBar, styles.podiumBarSecond]} />
                      <View style={[styles.podiumBar, styles.podiumBarFirst]} />
                      <View style={[styles.podiumBar, styles.podiumBarThird]} />
                    </View>
                  </View>
                )}

                {/* Ranking Table */}
                {hasRankings && (
                  <View style={styles.rankingTable}>
                    <Text style={styles.tableSectionLabel}>Clasificación general</Text>
                    {rankings.map((entry, i) => (
                      <StaggeredItem key={entry.id} index={(showPodium ? 3 : 0) + i}>
                        <RankingRow
                          entry={entry}
                          onPress={() => router.push(`/user/${entry.id}`)}
                        />
                      </StaggeredItem>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: withOpacity(colors.background, 0.85),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  appBarTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: colors.primaryContainer,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },

  /* Season header */
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.onSurface,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  playerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  playerCountText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },

  /* Segmented Control */
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    padding: 3,
    marginTop: spacing.lg,
    gap: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md - 2,
    borderCurve: 'continuous',
  },
  segmentTabActive: {
    backgroundColor: colors.primaryContainer,
  },
  segmentText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: colors.background,
  },

  /* Filter pills */
  filterScroll: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.xl,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Podium */
  podiumContainer: {
    marginTop: spacing.xl,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  podiumEntry: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  podiumEntryFirst: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingTop: spacing.md,
    marginBottom: 8,
  },
  podiumRing: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  posBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  posBadgeText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  podiumName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  podiumRankLabel: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  podiumMmr: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '900',
    marginTop: 2,
  },

  /* Podium base bars */
  podiumBase: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  podiumBar: {
    flex: 1,
    borderRadius: 2,
    borderCurve: 'continuous',
  },
  podiumBarSecond: {
    height: 4,
    backgroundColor: withOpacity(colors.secondary, 0.4),
  },
  podiumBarFirst: {
    height: 4,
    backgroundColor: withOpacity(colors.primaryContainer, 0.5),
  },
  podiumBarThird: {
    height: 4,
    backgroundColor: withOpacity(colors.tertiaryDim, 0.4),
  },

  /* Empty filter / Squad placeholder */
  emptyFilter: {
    marginTop: spacing['2xl'],
  },
  squadPlaceholder: {
    marginTop: spacing['3xl'],
  },

  /* Ranking table */
  rankingTable: {
    marginTop: spacing['2xl'],
  },
  tableSectionLabel: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  rankingRow: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: 4,
  },
  rankingRowYou: {
    borderWidth: 1,
    borderColor: withOpacity(colors.primaryContainer, 0.3),
    backgroundColor: withOpacity(colors.primaryContainer, 0.06),
  },
  rankNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: colors.outline,
    width: 28,
    textAlign: 'center',
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  rankYouLabel: {
    color: colors.primaryContainer,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  rankDivision: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  rankWinRate: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: colors.outlineVariant,
  },
  rankRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankMmr: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    fontWeight: '900',
  },
  rankTrend: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
  },
});
