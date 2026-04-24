import { View, Text as RNText, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { EmptyState, Icon, UserAvatar } from '../../components/atoms';
import { getOutcomeLabel } from '../../utils/rank-colors';
import { useProfile, useMatchHistory } from '../../hooks/useProfile';
import { useAuthStore } from '../../stores/auth';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Image as ExpoImage } from 'expo-image';
import { AnimatedCounter, StaggeredItem, AnimatedPressable, ProfileSkeleton, SkeletonLoader } from '../../components/animated';

/* ─── Rank System ─── */

function getRankData(mmr: number) {
  if (mmr >= 1700) return { label: 'DIAMANTE', tier: 'I', color: '#00f4fe', icon: 'diamond' as const, floor: 1700, next: 2000 };
  if (mmr >= 1500) return { label: 'PLATINO', tier: 'III', color: '#beee00', icon: 'shield-fill' as const, floor: 1500, next: 1700 };
  if (mmr >= 1300) return { label: 'ORO', tier: 'III', color: '#efc900', icon: 'trophy' as const, floor: 1300, next: 1500 };
  if (mmr >= 1100) return { label: 'PLATA', tier: 'II', color: '#c0c0c0', icon: 'shield' as const, floor: 1100, next: 1300 };
  return { label: 'BRONCE', tier: '', color: '#cd7f32', icon: 'shield' as const, floor: 0, next: 1100 };
}

/* ─── Match Row ─── */

function MatchRow({ match }: { match: { id: string; matchId?: string; outcome: 'victory' | 'defeat' | 'draw'; score: string; eloDelta: number; arena: string } }) {
  const router = useRouter();
  const { label, barColor } = getOutcomeLabel(match.outcome);
  const isWin = match.eloDelta > 0;

  return (
    <AnimatedPressable onPress={() => match.matchId && router.push(`/match/${match.matchId}`)} haptic="light" style={s.matchCard}>
      <View style={[s.matchAccent, { backgroundColor: barColor }]} />
      <View style={s.matchBody}>
        <View style={{ flex: 1 }}>
          <RNText style={[s.matchLabel, { color: barColor }]}>{label}</RNText>
          <RNText style={s.matchArena}>{match.arena}</RNText>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {match.score.includes('-') && <RNText style={s.matchScore}>{match.score}</RNText>}
          <View style={[s.eloPill, { backgroundColor: withOpacity(isWin ? colors.primaryContainer : colors.error, 0.12) }]}>
            <RNText style={[s.eloText, { color: isWin ? colors.primaryContainer : colors.error }]}>
              {isWin ? '+' : ''}{match.eloDelta}
            </RNText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

/* ─── Main ─── */

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { pickAndUpload, uploading } = useImageUpload();

  const { data: profile, isLoading } = useProfile();
  const { data: history, isLoading: historyLoading } = useMatchHistory();
  const user = profile ?? useAuthStore.getState().user;

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    setRefreshing(false);
  };

  if (isLoading) return <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}><ProfileSkeleton /></View>;
  if (!user) return <View style={s.root}><EmptyState icon="person" title="Sin perfil" description="Inicia sesión." /></View>;

  const rank = getRankData(user.mmr);
  const wins = user.wins ?? 0;
  const losses = user.losses ?? 0;
  const total = user.matchesPlayed ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const conductScore = user.conductScore ?? 0;
  const tierRange = rank.next - rank.floor;
  const progress = tierRange > 0 ? (user.mmr - rank.floor) / tierRange : 1;

  const recentMatches = (history ?? []).filter((h) => h.match).slice(0, 4).map((h) => {
    const delta = h.mmrAfter - h.mmrBefore;
    return {
      id: h.id, matchId: h.matchId,
      outcome: delta > 0 ? 'victory' as const : delta < 0 ? 'defeat' as const : 'draw' as const,
      score: (() => {
        const r = h.match.result;
        if (!r || !r.includes(' - ')) return '';
        const parts = r.split(' - ');
        const won = delta > 0;
        const aWon = Number(parts[0]) > Number(parts[1]);
        return won === aWon ? r : `${parts[1]} - ${parts[0]}`;
      })(),
      eloDelta: delta, arena: h.match.courtName ?? '',
    };
  });

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ TOP BAR ═══ */}
        <View style={s.topBar}>
          <RNText style={s.topTitle}>Perfil</RNText>
          <AnimatedPressable onPress={() => router.push('/settings')} haptic="light" style={s.gearBtn}>
            <Icon name="settings" size={18} color={colors.outline} />
          </AnimatedPressable>
        </View>

        {/* ═══ HERO CARD ═══ */}
        <View style={s.heroCardWrap}>
          <View style={s.heroCard}>
            {/* Top glow line */}
            <View style={[s.topGlow, { backgroundColor: rank.color }]} />
            {/* Top section: Avatar + Identity */}
            <View style={s.heroTop}>
              <AnimatedPressable onPress={pickAndUpload} disabled={uploading} haptic="light">
                <View style={[s.avatarOuter, { borderColor: rank.color }]}>
                  {user.photoUrl ? (
                    <ExpoImage source={{ uri: user.photoUrl }} style={s.avatarImg} contentFit="cover" />
                  ) : (
                    <View style={s.avatarPlaceholder}>
                      <RNText style={s.avatarLetter}>{user.name.charAt(0)}</RNText>
                    </View>
                  )}
                  {uploading && <View style={s.avatarLoading}><ActivityIndicator size="small" color={rank.color} /></View>}
                </View>
              </AnimatedPressable>

              <View style={s.identity}>
                <RNText style={s.playerName}>{user.name}</RNText>
                <View style={s.rankRow}>
                  <Icon name={rank.icon} size={14} color={rank.color} />
                  <RNText style={[s.rankLabel, { color: rank.color }]}>{rank.label} {rank.tier}</RNText>
                </View>
              </View>
            </View>

            {/* ELO Section — BIG NUMBER */}
            <View style={s.eloSection}>
              <View style={s.eloMain}>
                <RNText style={s.eloPrefix}>ELO</RNText>
                <AnimatedCounter value={user.mmr} style={[s.eloNumber, { color: rank.color }]} />
              </View>
              {/* Progress to next rank */}
              <View style={s.progressWrap}>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${Math.min(Math.max(progress * 100, 5), 100)}%`, backgroundColor: rank.color }]} />
                </View>
                <RNText style={[s.progressLabel, { color: rank.color }]}>→ {rank.next}</RNText>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              <View style={s.statBox}>
                <RNText style={[s.statNum, { color: colors.primaryContainer }]}>{winRate}<RNText style={s.statUnit}>%</RNText></RNText>
                <RNText style={s.statDesc}>WIN RATE</RNText>
              </View>
              <View style={[s.statBox, s.statBoxCenter]}>
                <RNText style={s.statNum}>{total}</RNText>
                <RNText style={s.statDesc}>{wins}V · {losses}D</RNText>
              </View>
              <View style={s.statBox}>
                <View style={s.starsRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Icon key={i} name={i < Math.floor(conductScore) ? 'star' : 'star-outline'} size={14}
                      color={i < Math.floor(conductScore) ? colors.tertiaryContainer : colors.outlineVariant} />
                  ))}
                </View>
                <RNText style={s.statDesc}>CONDUCTA</RNText>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={s.actionsRow}>
          {[
            { icon: 'trophy' as const, label: 'Ranking', color: colors.primaryContainer, route: '/leaderboard' },
            { icon: 'people' as const, label: 'Amigos', color: colors.secondary, route: '/friends' },
            { icon: 'shield' as const, label: 'Escuadra', color: colors.tertiary, route: '/squad' },
          ].map((a) => (
            <AnimatedPressable key={a.label} onPress={() => router.push(a.route as any)} haptic="light" style={s.actionBtn}>
              <Icon name={a.icon} size={18} color={a.color} />
              <RNText style={s.actionLabel}>{a.label}</RNText>
            </AnimatedPressable>
          ))}
        </View>

        {/* ═══ RECENT MATCHES ═══ */}
        <View style={s.matchSection}>
          <View style={s.matchHeader}>
            <RNText style={s.matchHeaderTitle}>Recientes</RNText>
            <AnimatedPressable onPress={() => router.navigate('/(tabs)/matches')} haptic="light">
              <RNText style={s.matchHeaderLink}>Ver Todos</RNText>
            </AnimatedPressable>
          </View>

          {historyLoading ? (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => <SkeletonLoader key={i} width="100%" height={48} borderRadius={radii.md} />)}
            </View>
          ) : recentMatches.length === 0 ? (
            <EmptyState icon="soccer" title="Sin partidos" description="Tu historial aparecerá aquí." />
          ) : (
            <View style={{ gap: spacing.xs }}>
              {recentMatches.map((m, i) => (
                <StaggeredItem key={m.id} index={i}><MatchRow match={m} /></StaggeredItem>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
  },
  topTitle: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 22, fontWeight: '700', color: colors.onSurface },
  gearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero card wrapper
  heroCardWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl, borderCurve: 'continuous',
    padding: spacing.xl,
    gap: spacing.xl,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute', top: 0, left: spacing['2xl'], right: spacing['2xl'],
    height: 2, borderRadius: 1,
    opacity: 0.6,
  },

  // Hero top — avatar + identity
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatarOuter: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2.5,
    padding: 2, overflow: 'hidden',
  },
  avatarImg: { width: 63, height: 63, borderRadius: 31.5 },
  avatarPlaceholder: {
    width: 63, height: 63, borderRadius: 31.5,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 24, fontWeight: '700', color: colors.onSurface },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  identity: { flex: 1, gap: 4 },
  playerName: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 20, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.5 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankLabel: { fontFamily: fontMap.Lexend['700'], fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  // ELO
  eloSection: { gap: spacing.sm },
  eloMain: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  eloPrefix: {
    fontFamily: fontMap.Lexend['700'], fontSize: 12, fontWeight: '700',
    color: colors.outline, textTransform: 'uppercase', letterSpacing: 3,
  },
  eloNumber: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 48, fontWeight: '700',
    fontStyle: 'italic', lineHeight: 52, letterSpacing: -2,
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: {
    fontFamily: fontMap.Lexend['700'], fontSize: 10, fontWeight: '700', letterSpacing: 1,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row' },
  statBox: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm,
  },
  statBoxCenter: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: withOpacity(colors.outlineVariant, 0.12),
  },
  statNum: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 22, fontWeight: '700',
    fontStyle: 'italic', lineHeight: 26, color: colors.onSurface,
  },
  statUnit: { fontSize: 14, fontStyle: 'normal' },
  statDesc: {
    fontFamily: fontMap.Lexend['400'], fontSize: 8, color: colors.outline,
    textTransform: 'uppercase', letterSpacing: 2,
  },
  starsRow: { flexDirection: 'row', gap: 1 },

  // Actions
  actionsRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1, backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: spacing.md, borderRadius: radii.md, borderCurve: 'continuous',
    alignItems: 'center', gap: 4,
  },
  actionLabel: {
    fontFamily: fontMap.Lexend['700'], fontSize: 8, color: colors.outline,
    textTransform: 'uppercase', letterSpacing: 2,
  },

  // Match section
  matchSection: { paddingHorizontal: spacing.lg, gap: spacing.md },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchHeaderTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 16, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.5,
  },
  matchHeaderLink: {
    fontFamily: fontMap.Lexend['700'], fontSize: 10, fontWeight: '700',
    color: colors.secondary, textTransform: 'uppercase', letterSpacing: 2,
  },

  // Match card
  matchCard: {
    backgroundColor: colors.surfaceContainer, borderRadius: radii.sm, borderCurve: 'continuous',
    overflow: 'hidden', flexDirection: 'row',
  },
  matchAccent: { width: 3 },
  matchBody: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  matchLabel: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 13, fontWeight: '700' },
  matchArena: { fontFamily: fontMap.Manrope['400'], fontSize: 10, color: colors.outline },
  matchScore: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 16, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.5 },
  eloPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  eloText: { fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 11, fontWeight: '700' },
});
