import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import { Text, Icon, UserAvatar, EmptyState } from '../../components/atoms';
import { AnimatedPressable } from '../../components/animated';
import { useFriends } from '../../hooks/useFriends';
import { useMySquad, useInviteToSquad, useSquadPendingInvites } from '../../hooks/useSquads';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { getErrorMessage } from '../../utils/api-error';
import { Alert } from 'react-native';

function getRankColor(mmr: number): string {
  if (mmr >= 1700) return '#00f4fe';
  if (mmr >= 1500) return '#beee00';
  if (mmr >= 1300) return '#efc900';
  if (mmr >= 1100) return '#c0c0c0';
  return '#cd7f32';
}

function getRankLabel(mmr: number): string {
  if (mmr >= 1700) return 'Diamante';
  if (mmr >= 1500) return 'Platino';
  if (mmr >= 1300) return 'Oro';
  if (mmr >= 1100) return 'Plata';
  return 'Bronce';
}

/* ─── Friend Card with invite animation ─── */
function FriendInviteCard({
  friend,
  status,
  onInvite,
}: {
  friend: { friendId: string; friendName: string; friendPhotoUrl: string | null; friendMmr: number };
  status: 'idle' | 'loading' | 'sent' | 'unavailable';
  onInvite: () => void;
}) {
  const mmrColor = getRankColor(friend.friendMmr);
  const rankLabel = getRankLabel(friend.friendMmr);

  return (
    <Animated.View layout={Layout.springify()} style={s.friendCard}>
      {/* Avatar with rank ring */}
      <View style={[s.avatarRing, { borderColor: withOpacity(mmrColor, 0.4) }]}>
        <UserAvatar
          photoUrl={friend.friendPhotoUrl}
          name={friend.friendName}
          size={44}
          borderColor={mmrColor}
        />
      </View>

      {/* Info */}
      <View style={s.friendInfo}>
        <Text style={s.friendName} numberOfLines={1}>
          {friend.friendName}
        </Text>
        <View style={s.friendMeta}>
          <View style={[s.rankDot, { backgroundColor: mmrColor }]} />
          <Text style={[s.friendMmr, { color: mmrColor }]}>
            {friend.friendMmr}
          </Text>
          <Text style={s.rankLabel}>{rankLabel}</Text>
        </View>
      </View>

      {/* Action Button */}
      {status === 'sent' ? (
        <Animated.View entering={ZoomIn.springify().damping(12)} style={s.sentBadge}>
          <View style={s.sentCheckCircle}>
            <Icon name="check" size={10} color={colors.background} />
          </View>
          <Text style={s.sentText}>Enviada</Text>
        </Animated.View>
      ) : status === 'unavailable' ? (
        <Animated.View entering={FadeIn.duration(200)} style={s.unavailableBadge}>
          <Text style={s.unavailableText}>En otro squad</Text>
        </Animated.View>
      ) : (
        <AnimatedPressable
          onPress={onInvite}
          haptic="medium"
          style={s.inviteBtn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Icon name="add" size={14} color={colors.background} />
              <Text style={s.inviteBtnText}>Invitar</Text>
            </>
          )}
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

/* ─── Main Screen ─── */
export default function InviteToSquadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: squad } = useMySquad();
  const inviteMutation = useInviteToSquad();
  const { data: pendingInvites } = useSquadPendingInvites(squad?.id ?? '');

  // Track status per friend: 'idle' | 'loading' | 'sent' | 'unavailable'
  const [friendStatus, setFriendStatus] = useState<Record<string, 'idle' | 'loading' | 'sent' | 'unavailable'>>({});

  // Pre-populate already-invited friends from server
  const pendingUserIds = new Set(pendingInvites?.map((inv) => inv.toUserId) ?? []);

  const memberIds = new Set(squad?.members?.map((m) => m.userId) ?? []);
  const availableFriends = (friends ?? []).filter((f) => !memberIds.has(f.friendId));

  // Derive effective status: server pending overrides local idle
  const getStatus = (friendId: string): 'idle' | 'loading' | 'sent' | 'unavailable' => {
    const local = friendStatus[friendId];
    if (local) return local;
    if (pendingUserIds.has(friendId)) return 'sent';
    return 'idle';
  };

  const sentCount = availableFriends.filter((f) => getStatus(f.friendId) === 'sent').length;

  const handleInvite = useCallback((friendId: string) => {
    if (!squad) return;
    setFriendStatus((prev) => ({ ...prev, [friendId]: 'loading' }));
    inviteMutation.mutate(
      { squadId: squad.id, userId: friendId },
      {
        onSuccess: () => {
          setFriendStatus((prev) => ({ ...prev, [friendId]: 'sent' }));
        },
        onError: async (e: unknown) => {
          const msg = await getErrorMessage(e);
          // If the user is already in a squad, mark as unavailable
          if (msg.includes('pertenece') || msg.includes('Ya existe')) {
            setFriendStatus((prev) => ({ ...prev, [friendId]: 'unavailable' }));
          } else {
            setFriendStatus((prev) => ({ ...prev, [friendId]: 'idle' }));
            Alert.alert('Error', msg);
          }
        },
      },
    );
  }, [squad, inviteMutation]);

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={s.backBtn}>
            <Icon name="back" size={20} color={colors.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Invitar Amigos</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Sent counter banner */}
        {sentCount > 0 && (
          <Animated.View entering={FadeIn.duration(200)} style={s.sentBanner}>
            <Icon name="check" size={14} color={colors.primaryContainer} />
            <Text style={s.sentBannerText}>
              {sentCount} invitaci{sentCount === 1 ? 'ón' : 'ones'} enviada{sentCount === 1 ? '' : 's'}
            </Text>
          </Animated.View>
        )}

        {/* Subtitle */}
        <Text style={s.subtitle}>
          Selecciona amigos para invitar a {squad?.name ?? 'tu escuadra'}
        </Text>

        {friendsLoading ? (
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 60 }} />
        ) : availableFriends.length === 0 ? (
          <EmptyState
            icon="people"
            title="Sin amigos disponibles"
            description="Todos tus amigos ya son miembros de la escuadra o no tienes amigos agregados."
          />
        ) : (
          <View style={s.list}>
            {availableFriends.map((friend) => (
              <FriendInviteCard
                key={friend.friendId}
                friend={friend}
                status={getStatus(friend.friendId)}
                onInvite={() => handleInvite(friend.friendId)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  // Subtitle
  subtitle: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 13,
    color: colors.outline,
    marginBottom: spacing.lg,
  },

  // Sent banner
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: withOpacity(colors.primaryContainer, 0.08),
    borderRadius: radii.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryContainer,
  },
  sentBannerText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 0.5,
  },

  // List
  list: { gap: spacing.xs },

  // Friend card
  friendCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarRing: {
    borderWidth: 2,
    borderRadius: 26,
    padding: 1,
  },
  friendInfo: { flex: 1, gap: 3 },
  friendName: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  friendMmr: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  rankLabel: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
  },

  // Invite button
  inviteBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
    justifyContent: 'center',
  },
  inviteBtnText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Sent badge
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: withOpacity(colors.primaryContainer, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(colors.primaryContainer, 0.2),
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    minWidth: 90,
    justifyContent: 'center',
  },
  sentCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Unavailable badge
  unavailableBadge: {
    backgroundColor: withOpacity(colors.outlineVariant, 0.1),
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
  },
});
