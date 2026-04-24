import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { Icon, EmptyState, UserAvatar } from '../../components/atoms';
import { AnimatedPressable, StaggeredItem } from '../../components/animated';
import {
  useMySquad,
  useLeaveSquad,
  useCreateSquad,
  useSquadRequests,
  useAcceptSquadInvite,
  useRejectSquadInvite,
  useKickMember,
} from '../../hooks/useSquads';
import { useAuthStore } from '../../stores/auth';
import { colors, spacing, radii, withOpacity, buttonStyles } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { getErrorMessage } from '../../utils/api-error';

function getRankColor(mmr: number): string {
  if (mmr >= 1700) return '#00f4fe';
  if (mmr >= 1500) return '#beee00';
  if (mmr >= 1300) return '#efc900';
  if (mmr >= 1100) return '#c0c0c0';
  return '#cd7f32';
}

export default function MySquadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: squad, isLoading } = useMySquad();
  const leaveSquad = useLeaveSquad();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const createSquad = useCreateSquad();
  const kickMember = useKickMember();
  const [squadName, setSquadName] = useState('');
  const [squadTag, setSquadTag] = useState('');

  const members = squad?.members ?? [];
  const maxMembers = 5;
  const emptySlots = maxMembers - members.length;
  const isCaptain = members.some((m) => m.userId === userId && m.role === 'captain');

  const squadRequests = useSquadRequests(squad?.id ?? '');
  const acceptInvite = useAcceptSquadInvite();
  const rejectInvite = useRejectSquadInvite();
  const requests = squadRequests.data ?? [];

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['squad'] });
  }, [queryClient]);

  // No squad — show create form + discover CTA
  if (!isLoading && !squad) {
    const canCreate = squadName.trim().length >= 2;
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.lg, flex: 1, justifyContent: 'center' }}>
          <View style={s.noSquadCard}>
            <Icon name="shield" size={48} color={colors.outline} />
            <Text style={s.noSquadTitle}>Sin Escuadra</Text>
            <Text style={s.noSquadDesc}>Crea tu propia escuadra o únete a una existente para competir juntos.</Text>

            {/* Create form */}
            <View style={s.createForm}>
              <TextInput
                style={s.createInput}
                placeholder="Nombre de la escuadra"
                placeholderTextColor={colors.outline}
                value={squadName}
                onChangeText={setSquadName}
                maxLength={30}
                autoCapitalize="words"
              />
              <TextInput
                style={s.createInput}
                placeholder="Tag (opcional, max 4)"
                placeholderTextColor={colors.outline}
                value={squadTag}
                onChangeText={(t) => setSquadTag(t.toUpperCase().slice(0, 4))}
                maxLength={4}
                autoCapitalize="characters"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <AnimatedPressable
                onPress={() => router.push('/squad/discover')}
                style={[buttonStyles.ghost, { flex: 1 }]}
                haptic="light"
              >
                <Text style={buttonStyles.ghostText}>Descubrir</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => {
                  if (!canCreate) return;
                  createSquad.mutate(
                    { name: squadName.trim(), tag: squadTag.trim() || undefined },
                    { onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)) },
                  );
                }}
                style={[buttonStyles.primary, { flex: 1, opacity: canCreate ? 1 : 0.4 }]}
                haptic="medium"
                disabled={!canCreate || createSquad.isPending}
              >
                <Text style={buttonStyles.primaryText}>
                  {createSquad.isPending ? 'Creando...' : 'Crear Escuadra'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primaryContainer} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={s.header}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={s.backBtn}>
            <Icon name="back" size={20} color={colors.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Escuadra</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ═══ SQUAD IDENTITY ═══ */}
        <View style={s.identityCard}>
          <View style={s.identityTop}>
            <View style={s.squadIcon}>
              <Icon name="shield-fill" size={28} color={colors.primaryContainer} />
            </View>
            <View style={s.identityInfo}>
              <Text style={s.squadName}>{squad?.name ?? 'Mi Escuadra'}</Text>
              {squad?.tag && <Text style={s.squadTag}>[{squad.tag}]</Text>}
            </View>
          </View>

          {/* Stats row */}
          <View style={s.squadStats}>
            <View style={s.squadStat}>
              <Text style={[s.squadStatNum, { color: colors.secondary }]}>{squad?.avgMmr ?? 0}</Text>
              <Text style={s.squadStatLabel}>MMR</Text>
            </View>
            <View style={s.squadStatDivider} />
            <View style={s.squadStat}>
              <Text style={[s.squadStatNum, { color: colors.primaryContainer }]}>{squad?.wins ?? 0}</Text>
              <Text style={s.squadStatLabel}>V</Text>
            </View>
            <View style={s.squadStatDivider} />
            <View style={s.squadStat}>
              <Text style={[s.squadStatNum, { color: colors.error }]}>{squad?.losses ?? 0}</Text>
              <Text style={s.squadStatLabel}>D</Text>
            </View>
            <View style={s.squadStatDivider} />
            <View style={s.squadStat}>
              <Text style={s.squadStatNum}>{members.length}/{maxMembers}</Text>
              <Text style={s.squadStatLabel}>Miembros</Text>
            </View>
          </View>
        </View>

        {/* ═══ MEMBERS ═══ */}
        <View style={s.membersSection}>
          <Text style={s.sectionTitle}>Miembros</Text>

          <View style={s.membersList}>
            {members.map((m, i) => {
              const isMe = m.userId === userId;
              const roleLabel = m.role === 'captain' ? 'Capitán' : 'Miembro';
              const mmrColor = getRankColor(m.mmr);

              return (
                <StaggeredItem key={m.userId} index={i}>
                  <AnimatedPressable
                    onPress={() => router.push(`/user/${m.userId}`)}
                    haptic="light"
                    style={isMe ? [s.memberCard, s.memberCardMe] : s.memberCard}
                  >
                    <UserAvatar photoUrl={m.photoUrl} name={m.name} size={40} borderColor={m.role === 'captain' ? colors.primaryContainer : undefined} />
                    <View style={s.memberInfo}>
                      <View style={s.memberNameRow}>
                        <Text style={s.memberName} numberOfLines={1}>{m.name}</Text>
                        {isMe && <Text style={s.meTag}>Tú</Text>}
                      </View>
                      <View style={s.memberMeta}>
                        {m.role === 'captain' && <Icon name="crown" size={10} color={colors.primaryContainer} />}
                        <Text style={s.memberRole}>{roleLabel}</Text>
                        <Text style={s.memberDot}>·</Text>
                        <Text style={[s.memberMmr, { color: mmrColor }]}>{m.mmr} MMR</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      {isCaptain && !isMe && (
                        <AnimatedPressable
                          onPress={() => {
                            Alert.alert(
                              'Expulsar miembro',
                              `¿Quieres expulsar a ${m.name} de la escuadra?`,
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                  text: 'Expulsar',
                                  style: 'destructive',
                                  onPress: () => kickMember.mutate(
                                    { squadId: squad!.id, userId: m.userId },
                                    { onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)) },
                                  ),
                                },
                              ],
                            );
                          }}
                          haptic="light"
                          style={s.kickBtn}
                        >
                          <Icon name="close" size={12} color={colors.error} />
                        </AnimatedPressable>
                      )}
                      <Icon name="back" size={14} color={colors.outlineVariant} style={{ transform: [{ scaleX: -1 }] }} />
                    </View>
                  </AnimatedPressable>
                </StaggeredItem>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) =>
              isCaptain ? (
                <AnimatedPressable
                  key={`empty-${i}`}
                  onPress={() => router.push('/squad/invite')}
                  haptic="light"
                  style={s.emptySlot}
                >
                  <View style={s.emptyAvatar}>
                    <Icon name="add" size={16} color={colors.secondary} />
                  </View>
                  <Text style={s.emptyTextInvite}>Invitar amigo</Text>
                </AnimatedPressable>
              ) : (
                <View key={`empty-${i}`} style={s.emptySlot}>
                  <View style={s.emptyAvatar}>
                    <Icon name="add" size={16} color={colors.outline} />
                  </View>
                  <Text style={s.emptyText}>Disponible</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* ═══ REQUESTS (captain only) ═══ */}
        {isCaptain && requests.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={s.requestsSection}>
            {/* Section header with notification badge */}
            <View style={s.requestsHeader}>
              <View style={s.requestsTitleRow}>
                <Icon name="people" size={16} color={colors.secondary} />
                <Text style={s.requestsSectionTitle}>Solicitudes</Text>
                <View style={s.requestsBadge}>
                  <Text style={s.requestsBadgeText}>{requests.length}</Text>
                </View>
              </View>
              <Text style={s.requestsSubtitle}>
                Jugadores quieren unirse a tu escuadra
              </Text>
            </View>

            <View style={s.requestsList}>
              {requests.map((req, i) => {
                const mmrColor = getRankColor(req.fromUserMmr);
                const rankLabel = req.fromUserMmr >= 1700 ? 'Diamante'
                  : req.fromUserMmr >= 1500 ? 'Platino'
                  : req.fromUserMmr >= 1300 ? 'Oro'
                  : req.fromUserMmr >= 1100 ? 'Plata'
                  : 'Bronce';

                return (
                  <Animated.View
                    key={req.id}
                    entering={SlideInRight.delay(i * 80).springify().damping(14)}
                    layout={Layout.springify()}
                    style={s.requestCard}
                  >
                    {/* Left accent bar */}
                    <View style={[s.requestAccent, { backgroundColor: mmrColor }]} />

                    {/* Avatar with rank ring */}
                    <View style={[s.requestAvatarWrap, { borderColor: withOpacity(mmrColor, 0.4) }]}>
                      <UserAvatar
                        photoUrl={req.fromUserPhotoUrl}
                        name={req.fromUserName}
                        size={44}
                        borderColor={mmrColor}
                      />
                    </View>

                    {/* Player info */}
                    <View style={s.requestInfo}>
                      <Text style={s.requestName} numberOfLines={1}>{req.fromUserName}</Text>
                      <View style={s.requestMeta}>
                        <View style={[s.requestRankDot, { backgroundColor: mmrColor }]} />
                        <Text style={[s.requestMmrValue, { color: mmrColor }]}>
                          {req.fromUserMmr}
                        </Text>
                        <Text style={s.requestRankLabel}>{rankLabel}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={s.requestActions}>
                      <AnimatedPressable
                        onPress={() => acceptInvite.mutate(req.id, {
                          onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
                        })}
                        haptic="medium"
                        style={s.acceptBtn}
                      >
                        <Icon name="check" size={14} color={colors.background} />
                        <Text style={s.acceptBtnText}>Aceptar</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        onPress={() => {
                          Alert.alert(
                            'Rechazar solicitud',
                            `¿Rechazar la solicitud de ${req.fromUserName}?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Rechazar',
                                style: 'destructive',
                                onPress: () => rejectInvite.mutate(req.id, {
                                  onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
                                }),
                              },
                            ],
                          );
                        }}
                        haptic="light"
                        style={s.rejectBtn}
                      >
                        <Icon name="close" size={12} color={colors.error} />
                      </AnimatedPressable>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ═══ ACTIONS ═══ */}
        <View style={s.actionsSection}>
          {squad && (
            <AnimatedPressable
              onPress={() => {
                Alert.alert(
                  'Salir de la escuadra',
                  isCaptain ? 'Eres el capitán. Si sales y no hay más miembros, la escuadra se eliminará.' : '¿Quieres salir de esta escuadra?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Salir', style: 'destructive',
                      onPress: () => leaveSquad.mutate(squad.id, {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['squad'] }),
                        onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
                      }),
                    },
                  ],
                );
              }}
              haptic="light"
              style={s.leaveBtn}
            >
              <Icon name="logout" size={16} color={colors.error} />
              <Text style={s.leaveBtnText}>Salir de la Escuadra</Text>
            </AnimatedPressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.xl,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 20, fontWeight: '700',
    color: colors.onSurface, letterSpacing: -0.5,
  },

  // Identity card
  identityCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.xl,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl, borderCurve: 'continuous',
    padding: spacing.xl, gap: spacing.xl,
  },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  squadIcon: {
    width: 56, height: 56, borderRadius: radii.lg, borderCurve: 'continuous',
    backgroundColor: withOpacity(colors.primaryContainer, 0.1),
    justifyContent: 'center', alignItems: 'center',
  },
  identityInfo: { flex: 1 },
  squadName: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 22, fontWeight: '700',
    color: colors.onSurface, letterSpacing: -0.5,
  },
  squadTag: {
    fontFamily: fontMap.Lexend['700'], fontSize: 12, fontWeight: '700',
    color: colors.primaryContainer, letterSpacing: 2,
  },

  // Squad stats
  squadStats: { flexDirection: 'row', alignItems: 'center' },
  squadStat: { flex: 1, alignItems: 'center', gap: 2 },
  squadStatNum: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 20, fontWeight: '700',
    fontStyle: 'italic', lineHeight: 24, color: colors.onSurface,
  },
  squadStatLabel: {
    fontFamily: fontMap.Lexend['400'], fontSize: 8, color: colors.outline,
    textTransform: 'uppercase', letterSpacing: 2,
  },
  squadStatDivider: {
    width: 1, height: 24, backgroundColor: withOpacity(colors.outlineVariant, 0.15),
  },

  // Members
  membersSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  sectionTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 16, fontWeight: '700',
    color: colors.onSurface, letterSpacing: -0.5,
  },
  membersList: { gap: spacing.xs },
  memberCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md, borderCurve: 'continuous',
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  memberCardMe: {
    borderWidth: 1, borderColor: withOpacity(colors.primaryContainer, 0.2),
  },
  memberInfo: { flex: 1, gap: 2 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 15, fontWeight: '700',
    color: colors.onSurface, flex: 1,
  },
  meTag: {
    fontFamily: fontMap.Lexend['700'], fontSize: 8, fontWeight: '700',
    color: colors.primaryContainer, backgroundColor: withOpacity(colors.primaryContainer, 0.1),
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberRole: {
    fontFamily: fontMap.Lexend['400'], fontSize: 10, color: colors.outline, letterSpacing: 0.5,
  },
  memberDot: { fontSize: 10, color: colors.outlineVariant },
  memberMmr: {
    fontFamily: fontMap.Lexend['700'], fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
  },

  // Empty slots
  emptySlot: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md, borderCurve: 'continuous',
    borderWidth: 1, borderColor: withOpacity(colors.outlineVariant, 0.1), borderStyle: 'dashed',
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  emptyAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontMap.Lexend['400'], fontSize: 12, color: colors.outline, letterSpacing: 1,
  },

  // Actions
  actionsSection: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: spacing.md, borderRadius: radii.md, borderCurve: 'continuous',
  },
  actionBtnText: {
    fontFamily: fontMap.Lexend['700'], fontSize: 11, fontWeight: '700',
    color: colors.secondary, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radii.md, borderCurve: 'continuous',
    backgroundColor: withOpacity(colors.error, 0.08),
  },
  leaveBtnText: {
    fontFamily: fontMap.Lexend['700'], fontSize: 11, fontWeight: '700',
    color: colors.error, letterSpacing: 1,
  },

  // Create form
  createForm: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  createInput: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontMap.Manrope['400'],
    fontSize: 14,
    color: colors.onSurface,
  },

  // Empty slot invite text
  emptyTextInvite: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1,
  },

  // Kick button
  kickBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: withOpacity(colors.error, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Requests Section ──
  requestsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  requestsHeader: { gap: 4 },
  requestsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestsSectionTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  requestsBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  requestsBadgeText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  requestsSubtitle: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 12,
    color: colors.outline,
    marginLeft: 24,
  },
  requestsList: { gap: spacing.sm },
  requestCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  requestAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  requestAvatarWrap: {
    borderWidth: 2,
    borderRadius: 26,
    padding: 1,
  },
  requestInfo: { flex: 1, gap: 3 },
  requestName: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  requestRankDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  requestMmrValue: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  requestRankLabel: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Accept / Reject buttons
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  acceptBtnText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: withOpacity(colors.error, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // No squad
  noSquadCard: {
    alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl, borderCurve: 'continuous',
    padding: spacing['2xl'],
  },
  noSquadTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'], fontSize: 20, fontWeight: '700', color: colors.onSurface,
  },
  noSquadDesc: {
    fontFamily: fontMap.Manrope['400'], fontSize: 14, color: colors.outline,
    textAlign: 'center', lineHeight: 20,
  },
});
