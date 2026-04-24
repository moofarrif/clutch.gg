import { View, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, EmptyState, Icon } from '../../components/atoms';
import { useDiscoverSquads, useRequestToJoinSquad, useMySquad } from '../../hooks/useSquads';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { AnimatedPressable, StaggeredItem } from '../../components/animated';
import { useState, useMemo } from 'react';
import Animated, { FadeIn, SlideInUp, ZoomIn, Layout } from 'react-native-reanimated';
import { getErrorMessage } from '../../utils/api-error';

function getRankColor(mmr: number): string {
  if (mmr >= 1700) return '#00f4fe';
  if (mmr >= 1500) return '#beee00';
  if (mmr >= 1300) return '#efc900';
  if (mmr >= 1100) return '#c0c0c0';
  return '#cd7f32';
}

function getRankTier(mmr: number): string {
  if (mmr >= 1700) return 'Diamante';
  if (mmr >= 1500) return 'Platino';
  if (mmr >= 1300) return 'Oro';
  if (mmr >= 1100) return 'Plata';
  return 'Bronce';
}

/* ─── Squad Card ─── */

function SquadCard({
  squad,
  index,
  status,
  onRequest,
}: {
  squad: {
    id: string;
    name: string;
    tag: string | null;
    avgMmr: number;
    wins: number;
    losses: number;
    createdAt: string;
    memberCount?: number;
  };
  index: number;
  status: 'idle' | 'loading' | 'sent';
  onRequest: () => void;
}) {
  const totalGames = squad.wins + squad.losses;
  const winRate = totalGames > 0 ? Math.round((squad.wins / totalGames) * 100) : 0;
  const mmrColor = getRankColor(squad.avgMmr);
  const rankTier = getRankTier(squad.avgMmr);
  const memberCount = squad.memberCount ?? 0;
  const isFull = memberCount >= 5;

  return (
    <StaggeredItem index={index}>
      <View
        style={st.card}
        accessibilityRole="summary"
        accessibilityLabel={`Escuadra ${squad.name}, MMR ${squad.avgMmr}, ${memberCount} de 5 miembros`}
      >
        {/* Left rank accent */}
        <View style={[st.cardAccent, { backgroundColor: mmrColor }]} />

        {/* Top row: Identity + Slots */}
        <View style={st.cardHeader}>
          <View style={st.cardIdentity}>
            {/* Shield icon */}
            <View style={[st.shieldWrap, { backgroundColor: withOpacity(mmrColor, 0.1) }]}>
              <Icon name="shield-fill" size={18} color={mmrColor} />
            </View>
            <View style={st.cardNameWrap}>
              <View style={st.cardNameRow}>
                <Text style={st.cardName} numberOfLines={1}>{squad.name}</Text>
                {squad.tag ? <Text style={st.cardTag}>[{squad.tag}]</Text> : null}
              </View>
              <View style={st.cardRankRow}>
                <View style={[st.rankDot, { backgroundColor: mmrColor }]} />
                <Text style={[st.rankTierText, { color: mmrColor }]}>{rankTier}</Text>
              </View>
            </View>
          </View>

          {/* Slots indicator */}
          <View style={st.slotsWrap}>
            <View style={st.slotsDotsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    st.slotDot,
                    i < memberCount
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: withOpacity(colors.outlineVariant, 0.2) },
                  ]}
                />
              ))}
            </View>
            <Text style={st.slotsText}>{memberCount}/5</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={st.statsRow}>
          <View style={st.statCell}>
            <Text style={[st.statValue, { color: mmrColor }]}>
              {(squad.avgMmr ?? 0).toLocaleString()}
            </Text>
            <Text style={st.statLabel}>MMR</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statCell}>
            <Text style={[st.statValue, { color: colors.primaryContainer }]}>
              {squad.wins}
            </Text>
            <Text style={st.statLabel}>V</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statCell}>
            <Text style={[st.statValue, { color: colors.error }]}>
              {squad.losses}
            </Text>
            <Text style={st.statLabel}>D</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statCell}>
            <Text style={[st.statValue, { color: colors.primaryContainer }]}>
              {winRate}%
            </Text>
            <Text style={st.statLabel}>Win</Text>
          </View>
        </View>

        {/* CTA */}
        {status === 'sent' ? (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={st.pendingBadge}>
            <Icon name="time" size={12} color={colors.secondary} />
            <Text style={st.pendingText}>Solicitud enviada</Text>
          </Animated.View>
        ) : isFull ? (
          <View style={st.fullBadge}>
            <Text style={st.fullText}>Escuadra completa</Text>
          </View>
        ) : (
          <AnimatedPressable
            onPress={onRequest}
            disabled={status === 'loading'}
            haptic="medium"
            style={st.ctaBtn}
            accessibilityRole="button"
            accessibilityLabel={`Solicitar unirse a ${squad.name}`}
          >
            {status === 'loading' ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Icon name="add" size={14} color={colors.background} />
                <Text style={st.ctaText}>Solicitar</Text>
              </>
            )}
          </AnimatedPressable>
        )}
      </View>
    </StaggeredItem>
  );
}

/* ─── Main Screen ─── */

export default function DiscoverSquadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: apiSquads, isLoading } = useDiscoverSquads();
  const { data: mySquad } = useMySquad();
  const requestJoin = useRequestToJoinSquad();
  const [requestStatus, setRequestStatus] = useState<Record<string, 'idle' | 'loading' | 'sent'>>({});
  const [search, setSearch] = useState('');
  const allSquads = (apiSquads ?? []).filter((s) => s.id !== mySquad?.id);

  const filtered = useMemo(() => {
    if (!search.trim()) return allSquads;
    const q = search.toLowerCase();
    return allSquads.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.tag?.toLowerCase().includes(q)),
    );
  }, [allSquads, search]);

  const handleRequest = (squadId: string) => {
    setRequestStatus((prev) => ({ ...prev, [squadId]: 'loading' }));
    requestJoin.mutate(squadId, {
      onSuccess: () => setRequestStatus((prev) => ({ ...prev, [squadId]: 'sent' })),
      onError: async (e: unknown) => {
        setRequestStatus((prev) => ({ ...prev, [squadId]: 'idle' }));
        Alert.alert('Error', await getErrorMessage(e));
      },
    });
  };

  return (
    <View style={st.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={st.header}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={st.backBtn}>
            <Icon name="back" size={20} color={colors.onSurface} />
          </AnimatedPressable>
          <Text style={st.headerTitle}>Descubrir</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ═══ SEARCH BAR ═══ */}
        <View style={st.searchBar} accessibilityRole="search">
          <Icon name="search" size={16} color={colors.outline} />
          <TextInput
            placeholder="Buscar por nombre o tag..."
            placeholderTextColor={colors.outline}
            style={st.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar escuadras"
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch('')} haptic="light">
              <Icon name="close" size={14} color={colors.outline} />
            </AnimatedPressable>
          )}
        </View>

        {/* ═══ RESULTS HEADER ═══ */}
        <View style={st.resultsHeader}>
          <Text style={st.resultsCount}>
            {filtered.length} escuadra{filtered.length !== 1 ? 's' : ''}
          </Text>
          <Text style={st.resultsSort}>Por MMR</Text>
        </View>

        {/* ═══ SQUAD LIST ═══ */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 60 }} />
        ) : filtered.length > 0 ? (
          <View style={st.list}>
            {filtered.map((squad, i) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                index={i}
                status={requestStatus[squad.id] ?? 'idle'}
                onRequest={() => handleRequest(squad.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="search"
            title={search ? 'Sin resultados' : 'Sin escuadras'}
            description={
              search
                ? `No se encontraron escuadras para "${search}".`
                : 'Aún no hay escuadras creadas. Sé el primero en crear una.'
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontMap.Manrope['400'],
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },

  // Results header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultsCount: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 12,
    color: colors.outline,
  },
  resultsSort: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // List
  list: { gap: spacing.md },

  // ── Card ──
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  shieldWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNameWrap: { flex: 1, gap: 2 },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardTag: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 1,
  },
  cardRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rankTierText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Slots
  slotsWrap: {
    alignItems: 'center',
    gap: 4,
  },
  slotsDotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotsText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 9,
    fontWeight: '700',
    color: colors.outline,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    paddingVertical: 10,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 1 },
  statValue: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    color: colors.onSurface,
  },
  statLabel: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 8,
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: withOpacity(colors.outlineVariant, 0.15),
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    paddingVertical: 11,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  ctaText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Pending
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: withOpacity(colors.secondary, 0.08),
    borderWidth: 1,
    borderColor: withOpacity(colors.secondary, 0.2),
    paddingVertical: 11,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  pendingText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
  },

  // Full
  fullBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withOpacity(colors.outlineVariant, 0.08),
    paddingVertical: 11,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  fullText: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 0.5,
  },
});
