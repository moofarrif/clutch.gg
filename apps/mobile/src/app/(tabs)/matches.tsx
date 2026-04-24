import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { EmptyState, Icon } from '../../components/atoms';
import { getOutcomeLabel } from '../../utils/rank-colors';
import { useProfile, useMatchHistory } from '../../hooks/useProfile';
import { AnimatedPressable, MatchRowSkeleton } from '../../components/animated';

/* ─── Types ─── */

interface MatchRowData {
  id: string;
  matchId: string;
  outcome: 'victory' | 'defeat' | 'draw';
  eloDelta: number;
  arena: string;
  date: string;
  score?: string;
}

/* ─── Match Card ─── */

function MatchCard({ match, onPress }: { match: MatchRowData; onPress: () => void }) {
  const { label, barColor } = getOutcomeLabel(match.outcome);
  const isWin = match.eloDelta > 0;
  const deltaColor = isWin ? colors.primaryContainer : colors.error;

  return (
    <AnimatedPressable onPress={onPress} haptic="light" style={styles.matchCard}>
      {/* Accent bar */}
      <View style={[styles.matchBar, { backgroundColor: barColor }]} />

      <View style={styles.matchBody}>
        {/* Top: Outcome + Score + Date */}
        <View style={styles.matchTopRow}>
          <View style={styles.matchOutcomeRow}>
            <Text style={[styles.matchOutcome, { color: barColor }]}>{label}</Text>
            {match.score && <Text style={styles.matchScore}>{match.score}</Text>}
          </View>
          <Text style={styles.matchDate}>{match.date}</Text>
        </View>

        {/* Bottom: Arena + ELO delta */}
        <View style={styles.matchBottomRow}>
          <View style={styles.matchArenaRow}>
            <Icon name="location" size={12} color={colors.outline} />
            <Text style={styles.matchArena} numberOfLines={1}>{match.arena}</Text>
          </View>
          <View style={[styles.eloBadge, { backgroundColor: withOpacity(deltaColor, 0.12) }]}>
            <Text style={[styles.eloText, { color: deltaColor }]}>
              {isWin ? '+' : ''}{match.eloDelta}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

/* ─── Main Screen ─── */

export default function MatchHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const queryClient = useQueryClient();

  const { data: profile } = useProfile();
  const { data: history, isLoading } = useMatchHistory();

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['match-history'] });
  }, [queryClient]);

  // Stats
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const totalMatches = profile?.matchesPlayed ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Parse history
  const matchRows: MatchRowData[] = (history ?? [])
    .filter((h) => h.match)
    .map((h) => {
      const delta = h.mmrAfter - h.mmrBefore;
      return {
        id: h.id,
        matchId: h.matchId ?? h.match.id,
        outcome: delta > 0 ? 'victory' as const : delta < 0 ? 'defeat' as const : 'draw' as const,
        eloDelta: delta,
        arena: h.match.courtName ?? 'Arena',
        date: new Date(h.match.dateTime).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
        score: (() => {
          if (!h.match.result || !h.match.result.includes(' - ')) return undefined;
          const parts = h.match.result.split(' - ');
          const won = delta > 0;
          const aWon = Number(parts[0]) > Number(parts[1]);
          // Show score from player's perspective: their goals first
          if (won === aWon) return h.match.result; // already correct order
          return `${parts[1]} - ${parts[0]}`; // flip
        })(),
      };
    });

  // Streak
  let streak = 0;
  let streakType: 'win' | 'loss' | null = null;
  for (const m of matchRows) {
    if (!streakType) {
      streakType = m.outcome === 'victory' ? 'win' : m.outcome === 'defeat' ? 'loss' : null;
      streak = 1;
    } else if ((streakType === 'win' && m.outcome === 'victory') || (streakType === 'loss' && m.outcome === 'defeat')) {
      streak++;
    } else break;
  }

  // Filter
  const filtered = filter === 'all' ? matchRows
    : filter === 'wins' ? matchRows.filter((m) => m.outcome === 'victory')
    : matchRows.filter((m) => m.outcome === 'defeat');

  const ListHeader = (
    <View style={styles.header}>
      {/* Title row */}
      <Text style={styles.title} accessibilityRole="header">Historial</Text>

      {/* Hero stat — big win rate */}
      <View style={styles.heroStat}>
        <View style={styles.heroStatLeft}>
          <Text style={styles.heroStatValue}>{winRate}<Text style={styles.heroStatUnit}>%</Text></Text>
          <Text style={styles.heroStatLabel}>Win Rate</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStatRight}>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: colors.primaryContainer }]}>{wins}</Text>
            <Text style={styles.miniStatLabel}>V</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: colors.error }]}>{losses}</Text>
            <Text style={styles.miniStatLabel}>D</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{totalMatches}</Text>
            <Text style={styles.miniStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Streak */}
      {streak >= 2 && streakType && (
        <View style={[styles.streakBadge, {
          backgroundColor: withOpacity(streakType === 'win' ? colors.primaryContainer : colors.error, 0.1),
        }]}>
          <Icon
            name={streakType === 'win' ? 'flame' : 'arrow-down'}
            size={16}
            color={streakType === 'win' ? colors.primaryContainer : colors.error}
          />
          <Text style={[styles.streakText, {
            color: streakType === 'win' ? colors.primaryContainer : colors.error,
          }]}>
            {streak} {streakType === 'win' ? 'victorias seguidas' : 'derrotas seguidas'}
          </Text>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Encuentros</Text>
        <View style={styles.filterRow}>
          {(['all', 'wins', 'losses'] as const).map((f) => {
            const labels = { all: 'Todos', wins: 'Victorias', losses: 'Derrotas' };
            const active = filter === f;
            return (
              <AnimatedPressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, active ? styles.filterChipActive : undefined]}
                haptic="light"
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : undefined]}>
                  {labels[f]}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: spacing.lg,
        }}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => item.matchId && router.push(`/match/${item.matchId}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: spacing.sm }}>{[0, 1, 2, 3].map((i) => <MatchRowSkeleton key={i} />)}</View>
          ) : (
            <EmptyState icon="soccer" title="Sin partidos aún" description="Tu historial aparecerá aquí después de jugar." />
          )
        }
        onRefresh={onRefresh}
        refreshing={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { gap: spacing.xl, marginBottom: spacing.xl },
  title: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -1,
  },

  // Hero stat
  heroStat: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatLeft: {
    alignItems: 'center',
    paddingRight: spacing.xl,
  },
  heroStatValue: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 52,
    color: colors.secondary,
  },
  heroStatUnit: {
    fontSize: 24,
    fontStyle: 'normal',
  },
  heroStatLabel: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: withOpacity(colors.outlineVariant, 0.3),
    marginVertical: spacing.sm,
  },
  heroStatRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: spacing.lg,
  },
  miniStat: { alignItems: 'center', gap: 2 },
  miniStatValue: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
  },
  miniStatLabel: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 9,
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Streak
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignSelf: 'flex-start',
  },
  streakText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Filter
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  filterRow: { flexDirection: 'row', gap: spacing.xs },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceContainerHighest,
  },
  filterChipActive: { backgroundColor: colors.primaryContainer },
  filterChipText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  filterChipTextActive: { color: colors.onPrimaryContainer },

  // Match card
  matchCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  matchBar: { width: 4 },
  matchBody: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchOutcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchOutcome: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  matchScore: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    marginLeft: spacing.sm,
  },
  matchDate: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1,
  },
  matchBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchArenaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  matchArena: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 13,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  eloBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  eloText: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 13,
    fontWeight: '700',
  },
});
