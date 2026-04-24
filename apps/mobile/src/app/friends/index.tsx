import { View, ScrollView, RefreshControl, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, EmptyState, Icon, UserAvatar } from '../../components/atoms';
import { AnimatedPressable, StaggeredItem, SkeletonLoader } from '../../components/animated';
import {
  useFriends,
  useFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useSendFriendRequest,
} from '../../hooks/useFriends';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/auth';
import { getErrorMessage } from '../../utils/api-error';
import Animated, { FadeIn, ZoomIn, Layout } from 'react-native-reanimated';

function getRankColor(mmr: number): string {
  if (mmr >= 1700) return '#00f4fe';
  if (mmr >= 1500) return '#beee00';
  if (mmr >= 1300) return '#efc900';
  if (mmr >= 1100) return '#c0c0c0';
  return '#cd7f32';
}

/* ─── Search Result Card ─── */
function SearchResultCard({
  user,
  isFriend,
  isPending,
  onAdd,
  onTap,
}: {
  user: { id: string; name: string; mmr: number; photoUrl: string | null };
  isFriend: boolean;
  isPending: boolean;
  onAdd: () => void;
  onTap: () => void;
}) {
  const mmrColor = getRankColor(user.mmr);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={s.searchResultCard}>
      <AnimatedPressable onPress={onTap} haptic="light" style={s.searchResultContent}>
        <UserAvatar photoUrl={user.photoUrl} name={user.name} size={40} borderColor={mmrColor} />
        <View style={s.searchResultInfo}>
          <Text style={s.searchResultName} numberOfLines={1}>{user.name}</Text>
          <View style={s.searchResultMeta}>
            <View style={[s.rankDot, { backgroundColor: mmrColor }]} />
            <Text style={[s.searchResultMmr, { color: mmrColor }]}>{user.mmr}</Text>
          </View>
        </View>
      </AnimatedPressable>

      {isFriend ? (
        <View style={s.alreadyFriendBadge}>
          <Icon name="check" size={10} color={colors.primaryContainer} />
          <Text style={s.alreadyFriendText}>Amigo</Text>
        </View>
      ) : isPending ? (
        <View style={s.pendingSentBadge}>
          <Text style={s.pendingSentText}>Enviada</Text>
        </View>
      ) : (
        <AnimatedPressable onPress={onAdd} haptic="medium" style={s.addBtn}>
          <Icon name="add" size={14} color={colors.background} />
          <Text style={s.addBtnText}>Agregar</Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

/* ─── Main Screen ─── */

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((st) => st.user?.id);
  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = useFriends();
  const { data: requests, refetch: refetchRequests } = useFriendRequests();
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const sendRequest = useSendFriendRequest();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // Search users query - only fires when search has 2+ chars
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => api.get(`users/search?q=${encodeURIComponent(search.trim())}&limit=10`)
      .json<Array<{ id: string; name: string; mmr: number; photoUrl: string | null }>>(),
    enabled: search.trim().length >= 2,
    staleTime: 15_000,
  });

  const friendIds = new Set(friends?.map((f) => f.friendId) ?? []);
  const isSearching = search.trim().length >= 2;

  // Filter out self from search results
  const filteredResults = (searchResults ?? []).filter((u) => u.id !== userId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFriends(), refetchRequests()]);
    setRefreshing(false);
  }, [refetchFriends, refetchRequests]);

  const handleAdd = (targetId: string) => {
    sendRequest.mutate(targetId, {
      onSuccess: () => setSentIds((prev) => new Set(prev).add(targetId)),
      onError: async (e: unknown) => Alert.alert('Error', await getErrorMessage(e)),
    });
  };

  const pendingCount = requests?.length ?? 0;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ HEADER ═══ */}
        <View style={s.header}>
          <AnimatedPressable onPress={() => router.back()} haptic="light" style={s.backBtn}>
            <Icon name="back" size={20} color={colors.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Amigos</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ═══ SEARCH BAR ═══ */}
        <View style={s.searchBar} accessibilityRole="search">
          <Icon name="search" size={16} color={colors.outline} />
          <TextInput
            placeholder="Buscar jugadores..."
            placeholderTextColor={colors.outline}
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar jugadores por nombre"
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch('')} haptic="light">
              <Icon name="close" size={14} color={colors.outline} />
            </AnimatedPressable>
          )}
        </View>

        {/* ═══ SEARCH RESULTS ═══ */}
        {isSearching && (
          <Animated.View entering={FadeIn.duration(200)} style={s.section}>
            <Text style={s.sectionTitle}>Resultados</Text>
            {searching ? (
              <ActivityIndicator size="small" color={colors.secondary} style={{ marginVertical: 20 }} />
            ) : filteredResults.length > 0 ? (
              <View style={s.list}>
                {filteredResults.map((user) => (
                  <SearchResultCard
                    key={user.id}
                    user={user}
                    isFriend={friendIds.has(user.id)}
                    isPending={sentIds.has(user.id)}
                    onAdd={() => handleAdd(user.id)}
                    onTap={() => router.push(`/user/${user.id}`)}
                  />
                ))}
              </View>
            ) : (
              <Text style={s.noResults}>
                No se encontraron jugadores para "{search}"
              </Text>
            )}
          </Animated.View>
        )}

        {/* ═══ PENDING REQUESTS ═══ */}
        {!isSearching && pendingCount > 0 && (
          <View style={s.section}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionTitle}>Solicitudes</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{pendingCount}</Text>
              </View>
            </View>
            <View style={s.list}>
              {requests?.map((req, i) => {
                const mmrColor = getRankColor(req.requesterMmr);
                return (
                  <StaggeredItem key={req.friendshipId} index={i}>
                    <View style={s.requestCard}>
                      <View style={[s.requestAccent, { backgroundColor: mmrColor }]} />
                      <UserAvatar photoUrl={req.requesterPhotoUrl} name={req.requesterName} size={40} borderColor={mmrColor} />
                      <View style={s.friendInfo}>
                        <Text style={s.friendName} numberOfLines={1}>{req.requesterName}</Text>
                        <View style={s.friendMeta}>
                          <View style={[s.rankDot, { backgroundColor: mmrColor }]} />
                          <Text style={[s.friendMmrValue, { color: mmrColor }]}>{req.requesterMmr}</Text>
                        </View>
                      </View>
                      <View style={s.requestActions}>
                        <AnimatedPressable
                          onPress={() => acceptMutation.mutate(req.friendshipId, {
                            onError: async (error: unknown) => Alert.alert('Error', await getErrorMessage(error)),
                          })}
                          haptic="medium"
                          style={s.acceptBtn}
                        >
                          <Icon name="check" size={12} color={colors.background} />
                          <Text style={s.acceptText}>Aceptar</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                          onPress={() => rejectMutation.mutate(req.friendshipId, {
                            onError: async (error: unknown) => Alert.alert('Error', await getErrorMessage(error)),
                          })}
                          haptic="light"
                          style={s.rejectBtn}
                        >
                          <Icon name="close" size={12} color={colors.error} />
                        </AnimatedPressable>
                      </View>
                    </View>
                  </StaggeredItem>
                );
              })}
            </View>
          </View>
        )}

        {/* ═══ MY FRIENDS ═══ */}
        {!isSearching && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Mis amigos ({friends?.length ?? 0})</Text>

            {friendsLoading ? (
              <View style={s.list}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={s.friendCard}>
                    <SkeletonLoader width={44} height={44} borderRadius={22} />
                    <View style={{ gap: 6, flex: 1 }}>
                      <SkeletonLoader width="60%" height={16} />
                      <SkeletonLoader width="35%" height={12} />
                    </View>
                  </View>
                ))}
              </View>
            ) : friends && friends.length > 0 ? (
              <View style={s.list}>
                {friends.map((friend, i) => {
                  const mmrColor = getRankColor(friend.friendMmr);
                  return (
                    <StaggeredItem key={friend.friendshipId} index={i}>
                      <AnimatedPressable
                        onPress={() => router.push(`/user/${friend.friendId}`)}
                        haptic="light"
                        style={s.friendCard}
                      >
                        <UserAvatar photoUrl={friend.friendPhotoUrl} name={friend.friendName} size={44} borderColor={mmrColor} />
                        <View style={s.friendInfo}>
                          <Text style={s.friendName} numberOfLines={1}>{friend.friendName}</Text>
                          <View style={s.friendMeta}>
                            <View style={[s.rankDot, { backgroundColor: mmrColor }]} />
                            <Text style={[s.friendMmrValue, { color: mmrColor }]}>{friend.friendMmr}</Text>
                            {friend.friendCity ? (
                              <>
                                <Text style={s.metaDot}>·</Text>
                                <Text style={s.friendCity}>{friend.friendCity}</Text>
                              </>
                            ) : null}
                          </View>
                        </View>
                        <Icon name="back" size={14} color={colors.outlineVariant} style={{ transform: [{ scaleX: -1 }] }} />
                      </AnimatedPressable>
                    </StaggeredItem>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="people"
                title="Sin amigos aún"
                description="Busca jugadores por nombre para enviarles solicitud de amistad."
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
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
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontMap.Manrope['400'],
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },

  // Sections
  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  list: { gap: spacing.xs },

  // Request card
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
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
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
  acceptText: {
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
  friendMmrValue: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  metaDot: { fontSize: 10, color: colors.outlineVariant },
  friendCity: {
    fontFamily: fontMap.Lexend['400'],
    fontSize: 10,
    color: colors.outline,
  },

  // Search results
  searchResultCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchResultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchResultInfo: { flex: 1, gap: 3 },
  searchResultName: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchResultMmr: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noResults: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  addBtnText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Already friend badge
  alreadyFriendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withOpacity(colors.primaryContainer, 0.1),
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  alreadyFriendText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 0.5,
  },

  // Pending sent
  pendingSentBadge: {
    backgroundColor: withOpacity(colors.secondary, 0.08),
    borderWidth: 1,
    borderColor: withOpacity(colors.secondary, 0.2),
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  pendingSentText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
});
