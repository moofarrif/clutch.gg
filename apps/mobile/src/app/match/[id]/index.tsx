import { View, ScrollView, Text, Share, StyleSheet, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchDetail, useJoinMatch, useLeaveMatch, useDeleteMatch, useConfirmAttendance } from '../../../hooks/useMatches';
import { useMatchSocket } from '../../../hooks/useSocket';
import { useAuthStore } from '../../../stores/auth';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../../theme';
import { PulsingDot, StaggeredItem, AnimatedPressable, SuccessCheck } from '../../../components/animated';
import { Icon, UserAvatar } from '../../../components/atoms';
import { Image as ExpoImage } from 'expo-image';
import { useState, useEffect, useRef } from 'react';
import { getErrorMessage } from '../../../utils/api-error';

export default function MatchLobbyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  useMatchSocket(id);

  const { data: match, isLoading } = useMatchDetail(id);
  const joinMatch = useJoinMatch();
  const leaveMatch = useLeaveMatch();
  const deleteMatch = useDeleteMatch();
  const confirmAttendance = useConfirmAttendance();
  const [showSuccess, setShowSuccess] = useState(false);

  const players = match?.players ?? [];
  const TOTAL_SLOTS = match?.maxPlayers ?? 10;

  const userId = useAuthStore((s) => s.user?.id);
  const isInMatch = players.some((p) => p.userId === userId);
  const myPlayer = players.find((p) => p.userId === userId);
  const isCreator = match?.creatorId === userId;
  const isAlone = players.length <= 1;
  const status = match?.status ?? 'open';
  const canJoin = status === 'open';
  const isCompleted = status === 'completed';
  const isPlaying = status === 'playing';

  // Teams
  const teamA = players.filter((p) => p.team === 'A' || p.team === 'team_a');
  const teamB = players.filter((p) => p.team === 'B' || p.team === 'team_b');
  const hasTeams = teamA.length > 0 && teamB.length > 0;
  const avgMmrA = teamA.length > 0 ? Math.round(teamA.reduce((s, p) => s + p.user.mmr, 0) / teamA.length) : 0;
  const avgMmrB = teamB.length > 0 ? Math.round(teamB.reduce((s, p) => s + p.user.mmr, 0) / teamB.length) : 0;

  // Score
  const hasScore = match?.result?.includes(' - ');
  const scoreParts = hasScore ? match!.result!.split(' - ') : null;

  // Draft animation
  const [showDraftComplete, setShowDraftComplete] = useState(false);
  const prevStatus = useRef(match?.status);
  useEffect(() => {
    if (prevStatus.current !== 'playing' && match?.status === 'playing') setShowDraftComplete(true);
    prevStatus.current = match?.status;
  }, [match?.status]);

  const EMPTY_SLOTS = TOTAL_SLOTS - players.length;
  const formatLabel = match ? `${match.maxPlayers / 2}v${match.maxPlayers / 2}` : '5v5';

  if (isLoading) {
    return <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primaryContainer} /></View>;
  }

  const handleShare = async () => {
    try {
      await Share.share({ message: `¡Únete a mi partido en Clutch.gg!\n${match?.courtName ?? 'Partido'}` });
    } catch {}
  };

  // Format date/time
  const dateStr = match?.dateTime ? new Date(match.dateTime).toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' }) : '';
  const timeStr = match?.dateTime ? (() => {
    const d = new Date(match.dateTime);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  })() : '';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HERO — Court photo + overlay ═══ */}
        <View style={[styles.hero, { height: screenHeight * 0.42 }]}>
          {match?.courtPhoto ? (
            <ExpoImage source={{ uri: match.courtPhoto }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surfaceContainerHigh }]} />
          )}
          <View style={styles.heroOverlay} />

          <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
            {/* Back button */}
            <AnimatedPressable onPress={() => router.back()} style={styles.backBtn} haptic="light">
              <Icon name="back" size={20} color={colors.onSurface} />
            </AnimatedPressable>

            {/* Status badge */}
            <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : isPlaying ? styles.statusPlaying : styles.statusOpen]}>
              {!isCompleted && !isPlaying && <PulsingDot color={colors.secondary} size={6} />}
              <Text style={styles.statusText}>
                {isCompleted ? 'Finalizado' : isPlaying ? 'En juego' : status === 'full' ? 'Completo' : status === 'drafting' ? 'Sorteando...' : 'En vivo'}
              </Text>
            </View>

            {/* Court name */}
            <Text style={styles.courtName}>{match?.courtName}</Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="calendar" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.metaText}>{dateStr}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="time" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.metaText}>{timeStr}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="people" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.metaText}>{players.length}/{TOTAL_SLOTS} · {formatLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ SCORE CARD — only when completed with score ═══ */}
        {hasTeams && hasScore && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreTeam}>
              <Text style={[styles.scoreTeamLabel, { color: colors.primaryContainer }]}>EQ. A</Text>
              <Text style={styles.scoreTeamMmr}>{avgMmrA}</Text>
            </View>
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreValue}>{scoreParts![0]}</Text>
              <Text style={styles.scoreDash}>—</Text>
              <Text style={styles.scoreValue}>{scoreParts![1]}</Text>
            </View>
            <View style={styles.scoreTeam}>
              <Text style={[styles.scoreTeamLabel, { color: colors.secondary }]}>EQ. B</Text>
              <Text style={styles.scoreTeamMmr}>{avgMmrB}</Text>
            </View>
          </View>
        )}

        {/* ═══ TEAMS / ROSTER ═══ */}
        <View style={styles.rosterSection}>
          {hasTeams ? (
            <>
              {/* Team headers */}
              <View style={styles.teamsHeader}>
                <Text style={[styles.teamLabel, { color: colors.primaryContainer }]}>Equipo A</Text>
                <Text style={styles.vsLabel}>VS</Text>
                <Text style={[styles.teamLabel, { color: colors.secondary }]}>Equipo B</Text>
              </View>

              {/* Two columns */}
              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  {teamA.map((p, i) => (
                    <StaggeredItem key={p.userId} index={i}>
                      <View style={[styles.teamCard, { borderLeftColor: colors.primaryContainer }]}>
                        <UserAvatar photoUrl={p.user.photoUrl} name={p.user.name} size={28} />
                        <View style={styles.teamCardInfo}>
                          <Text style={styles.teamCardName} numberOfLines={1}>{p.user.name}</Text>
                          <Text style={styles.teamCardMmr}>{p.user.mmr}</Text>
                        </View>
                      </View>
                    </StaggeredItem>
                  ))}
                  <Text style={[styles.avgMmr, { color: colors.primaryContainer }]}>AVG {avgMmrA}</Text>
                </View>

                <View style={styles.teamCol}>
                  {teamB.map((p, i) => (
                    <StaggeredItem key={p.userId} index={i + 5}>
                      <View style={[styles.teamCard, { borderLeftColor: colors.secondary }]}>
                        <UserAvatar photoUrl={p.user.photoUrl} name={p.user.name} size={28} />
                        <View style={styles.teamCardInfo}>
                          <Text style={styles.teamCardName} numberOfLines={1}>{p.user.name}</Text>
                          <Text style={styles.teamCardMmr}>{p.user.mmr}</Text>
                        </View>
                      </View>
                    </StaggeredItem>
                  ))}
                  <Text style={[styles.avgMmr, { color: colors.secondary }]}>AVG {avgMmrB}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.rosterTitle}>
                Plantel <Text style={styles.rosterCount}>{players.length}/{TOTAL_SLOTS}</Text>
              </Text>
              <View style={styles.rosterList}>
                {players.map((p, i) => (
                  <StaggeredItem key={p.userId} index={i}>
                    <View style={styles.playerCard}>
                      <UserAvatar photoUrl={p.user.photoUrl} name={p.user.name} size={40} />
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{p.user.name}</Text>
                        <Text style={styles.playerMmr}>MMR {p.user.mmr}</Text>
                      </View>
                    </View>
                  </StaggeredItem>
                ))}
                {Array.from({ length: EMPTY_SLOTS }).map((_, i) => (
                  <View key={`e-${i}`} style={styles.emptySlot}>
                    <View style={styles.emptyAvatar}><Text style={styles.emptyQ}>?</Text></View>
                    <Text style={styles.emptyText}>Esperando...</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ═══ CTA BAR ═══ */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.ctaRow}>
          <AnimatedPressable onPress={handleShare} style={styles.shareBtn} haptic="light">
            <Icon name="share" size={20} color={colors.onSurface} />
          </AnimatedPressable>

          {isCompleted ? (
            <View style={[buttonStyles.ghost, { flex: 1 }]}>
              <Text style={buttonStyles.ghostText}>Partido Finalizado</Text>
            </View>
          ) : hasTeams ? (
            myPlayer?.confirmed ? (
              <View style={[buttonStyles.primary, { flex: 1, opacity: 0.7 }]}>
                <Icon name="check" size={16} color={colors.onPrimaryContainer} />
                <Text style={buttonStyles.primaryText}>Confirmado</Text>
              </View>
            ) : isInMatch ? (
              <AnimatedPressable onPress={() => confirmAttendance.mutate(id)} style={[buttonStyles.primary, shadow('ctaLime'), { flex: 1 }]} scaleDown={0.95} haptic="medium">
                <Text style={buttonStyles.primaryText}>Confirmar Asistencia</Text>
              </AnimatedPressable>
            ) : (
              <View style={[buttonStyles.primary, { flex: 1 }]}>
                <Text style={buttonStyles.primaryText}>Equipos Listos</Text>
              </View>
            )
          ) : isInMatch ? (
            <>
              <View style={[buttonStyles.ghost, { flex: 1 }]}>
                <Text style={buttonStyles.ghostText}>Inscrito</Text>
              </View>
              {canJoin && (
                <AnimatedPressable
                  onPress={() => {
                    if (isCreator && isAlone) {
                      Alert.alert('Eliminar partido', '¿Eliminar este partido?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMatch.mutate(id, {
                          onSuccess: () => router.replace('/(tabs)/explore'),
                          onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
                        })},
                      ]);
                    } else {
                      leaveMatch.mutate(id, {
                        onSuccess: () => router.replace('/(tabs)/explore'),
                        onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
                      });
                    }
                  }}
                  style={styles.leaveBtn} scaleDown={0.93} haptic="medium"
                >
                  <Text style={styles.leaveBtnText}>{isCreator && isAlone ? 'Eliminar' : 'Salir'}</Text>
                </AnimatedPressable>
              )}
            </>
          ) : canJoin ? (
            <AnimatedPressable
              onPress={() => joinMatch.mutate(id, {
                onSuccess: () => setShowSuccess(true),
                onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
              })}
              style={[buttonStyles.primary, shadow('ctaLime'), { flex: 1 }]} scaleDown={0.95} haptic="medium"
            >
              <Text style={buttonStyles.primaryText}>Unirse al Partido</Text>
            </AnimatedPressable>
          ) : (
            <View style={[buttonStyles.disabled, { flex: 1 }]}>
              <Text style={buttonStyles.disabledText}>Partido cerrado</Text>
            </View>
          )}
        </View>
      </View>

      <SuccessCheck visible={showSuccess} message="¡Te uniste!" onDone={() => setShowSuccess(false)} />
      <SuccessCheck visible={showDraftComplete} message="¡Equipos sorteados!" onDone={() => setShowDraftComplete(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Hero
  hero: { position: 'relative', justifyContent: 'flex-end' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: { padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.md, zIndex: 2 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: withOpacity(colors.background, 0.5),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radii.full, borderCurve: 'continuous',
    alignSelf: 'flex-start',
  },
  statusOpen: { backgroundColor: withOpacity(colors.secondary, 0.2) },
  statusPlaying: { backgroundColor: withOpacity(colors.primaryContainer, 0.2) },
  statusCompleted: { backgroundColor: withOpacity(colors.outline, 0.2) },
  statusText: {
    fontFamily: 'Lexend_700Bold', fontSize: 10, fontWeight: '700',
    color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  courtName: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 26, fontWeight: '700',
    color: colors.white, lineHeight: 32, letterSpacing: -1,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: 'Lexend_400Regular', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 0.5,
  },

  // Score card (esports broadcast style)
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.lg, marginTop: -spacing['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg, borderCurve: 'continuous',
    padding: spacing.xl, zIndex: 5,
    borderWidth: 1, borderColor: withOpacity(colors.outlineVariant, 0.2),
  },
  scoreTeam: { alignItems: 'center', gap: 2, flex: 1 },
  scoreTeamLabel: {
    fontFamily: 'Lexend_700Bold', fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2,
  },
  scoreTeamMmr: {
    fontFamily: 'Lexend_400Regular', fontSize: 10, color: colors.outline, letterSpacing: 1,
  },
  scoreCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreValue: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 40, fontWeight: '700',
    fontStyle: 'italic', lineHeight: 46, color: colors.onSurface,
  },
  scoreDash: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: colors.outline,
  },

  // Teams
  rosterSection: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  teamsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  teamLabel: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  vsLabel: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, fontWeight: '900',
    fontStyle: 'italic', color: colors.outline,
  },
  teamsRow: { flexDirection: 'row', gap: spacing.sm },
  teamCol: { flex: 1, gap: spacing.sm },
  teamCard: {
    backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.md, borderCurve: 'continuous',
    padding: spacing.md, paddingLeft: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderLeftWidth: 3,
  },
  teamCardInfo: { flex: 1 },
  teamCardName: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 11, fontWeight: '700', color: colors.onSurface,
  },
  teamCardMmr: {
    fontFamily: 'Lexend_400Regular', fontSize: 9, color: colors.outline, letterSpacing: 1,
  },
  avgMmr: {
    fontFamily: 'Lexend_700Bold', fontSize: 10, fontWeight: '700',
    textAlign: 'center', marginTop: spacing.sm, letterSpacing: 2,
  },

  // Flat roster (pre-draft)
  rosterTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.5,
  },
  rosterCount: { color: colors.outline },
  rosterList: { gap: spacing.sm, marginTop: spacing.lg },
  playerCard: {
    backgroundColor: colors.surfaceContainer, borderRadius: radii.md, borderCurve: 'continuous',
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  playerInfo: { flex: 1, gap: 2 },
  playerName: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 15, fontWeight: '700', color: colors.onSurface,
  },
  playerMmr: {
    fontFamily: 'Lexend_400Regular', fontSize: 10, color: colors.secondary, letterSpacing: 0.5,
  },
  emptySlot: {
    backgroundColor: colors.surfaceContainerLow, borderWidth: 1,
    borderColor: withOpacity(colors.outlineVariant, 0.15), borderStyle: 'dashed',
    borderRadius: radii.md, borderCurve: 'continuous',
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  emptyAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center',
  },
  emptyQ: { fontSize: 16, color: colors.outline, opacity: 0.3 },
  emptyText: {
    fontFamily: 'Lexend_400Regular', fontSize: 11, color: colors.outline, letterSpacing: 1,
  },

  // CTA bar
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: withOpacity(colors.surfaceContainer, 0.95),
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: withOpacity(colors.outlineVariant, 0.15),
  },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  shareBtn: {
    width: 48, height: 48, borderRadius: radii.md, borderCurve: 'continuous',
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  leaveBtn: {
    backgroundColor: withOpacity(colors.error, 0.12),
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderRadius: radii.full, borderCurve: 'continuous',
    justifyContent: 'center', alignItems: 'center',
  },
  leaveBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 13, fontWeight: '700',
    color: colors.error, textTransform: 'uppercase', letterSpacing: 1,
  },
});
