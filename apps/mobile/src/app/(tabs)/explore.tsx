import { View, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Text, EmptyState, Icon, UserAvatar } from '../../components/atoms';
import { useAuthStore } from '../../stores/auth';
import { MatchCard } from '../../components/organisms';
import { AnimatedPressable, MatchCardSkeleton } from '../../components/animated';
import { useMatchesNearby, useMatchesInfinite } from '../../hooks/useMatches';
import { useProfile } from '../../hooks/useProfile';
import { config } from '../../config';
import { useLocation } from '../../hooks/useLocation';
import { colors, spacing, radii, withOpacity } from '../../theme';
import { useState, useCallback } from 'react';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const authUser = useAuthStore((s) => s.user);
  const user = profile ?? authUser;
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState<'nearby' | 'all'>('all');
  const queryClient = useQueryClient();

  // GPS
  const { location, loading: locationLoading } = useLocation();
  const hasLocation = location && location.lat !== 0;
  const showNearby = filter === 'nearby' && hasLocation;

  // Nearby (non-paginated)
  const { data: nearbyMatches, isLoading: nearbyLoading } = useMatchesNearby(
    location?.lat ?? 0, location?.lng ?? 0, config.nearbyRadiusM,
  );

  // All matches (infinite scroll)
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMatchesInfinite('open');

  const allMatches = infiniteData?.pages.flat() ?? [];
  const rawMatches = showNearby ? (nearbyMatches ?? []) : allMatches;
  const isLoading = showNearby ? (locationLoading || nearbyLoading) : infiniteLoading;

  // Search filter
  const searchTerm = search.trim().toLowerCase();
  const matches = searchTerm
    ? rawMatches.filter((m) => m.courtName?.toLowerCase().includes(searchTerm))
    : rawMatches;

  // Autocomplete
  const suggestions = searchTerm.length > 0
    ? [...new Set(rawMatches.map((m) => m.courtName).filter(Boolean))]
        .filter((name) => name.toLowerCase().includes(searchTerm))
        .slice(0, 5)
    : [];

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['matches'] });
  }, [queryClient]);

  const onEndReached = useCallback(() => {
    if (!showNearby && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [showNearby, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListHeader = (
    <View style={styles.headerContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]} accessibilityRole="search">
          <Icon name="search" size={18} color={searchFocused ? colors.primaryContainer : colors.outline} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Buscar cancha..."
            placeholderTextColor={colors.outline}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch('')} haptic="light" style={styles.searchClear}>
              <Icon name="close" size={14} color={colors.outline} />
            </AnimatedPressable>
          )}
        </View>
        {searchFocused && searchTerm.length > 0 && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((name, i) => (
              <AnimatedPressable
                key={name}
                onPress={() => { setSearch(name); setSearchFocused(false); }}
                haptic="light"
                style={[styles.suggestionRow, i < suggestions.length - 1 ? styles.suggestionBorder : undefined]}
              >
                <Icon name="location" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.suggestionText}>{name}</Text>
              </AnimatedPressable>
            ))}
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <AnimatedPressable
          onPress={() => setFilter('all')}
          style={[styles.filterChip, filter === 'all' ? styles.filterChipActive : undefined]}
          haptic="light"
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>Todos</Text>
        </AnimatedPressable>
        {hasLocation && (
          <AnimatedPressable
            onPress={() => setFilter('nearby')}
            style={[styles.filterChip, filter === 'nearby' ? styles.filterChipActive : undefined]}
            haptic="light"
          >
            <Icon name="location" size={12} color={filter === 'nearby' ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
            <Text style={[styles.filterChipText, filter === 'nearby' && styles.filterChipTextActive]}>Cerca de ti</Text>
          </AnimatedPressable>
        )}
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text variant="headlineSmall" style={styles.sectionTitle} accessibilityRole="header">
          Partidos en Vivo
        </Text>
        <Text variant="labelSmall" style={styles.sectionCount}>
          {matches.length} encontrados
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* App Bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.appBarLeft}>
          <UserAvatar photoUrl={user?.photoUrl} name={user?.name} size={36} borderColor={colors.secondary} />
          <Text variant="headlineMedium" style={styles.brandText}>CLUTCH.GG</Text>
        </View>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel="Notificaciones">
          <Icon name="bell" size={22} color={colors.outline} />
        </AnimatedPressable>
      </View>

      {/* Match list with infinite scroll */}
      <FlatList
        data={isLoading ? [] : matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
        }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item: match }) => (
          <MatchCard
            courtName={match.courtName}
            courtPhoto={match.courtPhoto}
            time={new Date(match.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: true })}
            playersJoined={match.playerCount ?? match.player_count ?? 0}
            maxPlayers={match.maxPlayers ?? 10}
            distance={match.distance ? `${(match.distance / 1000).toFixed(1)} km` : undefined}
            onPress={() => router.push(`/match/${match.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.matchList}>
              {[0, 1, 2].map((i) => <MatchCardSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState icon="soccer" title="No hay partidos disponibles" description="Crea uno o intenta cambiar los filtros" />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primaryContainer} style={{ paddingVertical: spacing.xl }} />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={onRefresh}
        refreshing={false}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <AnimatedPressable
        onPress={() => router.push('/match/create')}
        scaleDown={0.9}
        haptic="medium"
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
        accessibilityRole="button"
        accessibilityLabel="Crear partido"
      >
        <Icon name="add" size={28} color={colors.onPrimary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // App bar
  appBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: withOpacity(colors.background, 0.92),
    paddingBottom: 12, paddingHorizontal: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: radii.full, borderCurve: 'continuous',
    borderWidth: 2, borderColor: colors.secondary, backgroundColor: colors.surfaceContainerHighest,
  },
  brandText: {
    fontSize: 24, fontWeight: '900', fontStyle: 'italic', lineHeight: 30,
    color: colors.primaryContainer, letterSpacing: -1,
  },

  // Header content (inside FlatList)
  headerContent: { gap: spacing.lg, marginBottom: spacing.sm },

  // Search
  searchContainer: { zIndex: 20 },
  searchBar: {
    backgroundColor: colors.surfaceContainer, borderRadius: radii.md, borderCurve: 'continuous',
    flexDirection: 'row', paddingHorizontal: spacing.lg, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchBarFocused: { borderColor: colors.primaryContainer, backgroundColor: colors.surfaceContainerHigh },
  searchInput: {
    flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md, color: colors.onSurface,
  },
  searchClear: { padding: spacing.xs },
  suggestionsBox: {
    backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.md, borderCurve: 'continuous',
    marginTop: spacing.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  suggestionText: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: colors.onSurface },

  // Filters
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radii.full, borderCurve: 'continuous',
  },
  filterChipActive: { backgroundColor: colors.primaryContainer },
  filterChipText: {
    fontFamily: 'Lexend_700Bold', fontSize: 11, fontWeight: '700',
    color: colors.onSurfaceVariant, letterSpacing: 1,
  },
  filterChipTextActive: { color: colors.onPrimaryContainer },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', fontStyle: 'italic', lineHeight: 26,
    color: colors.primaryContainer,
  },
  sectionCount: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2,
    color: colors.outline,
  },

  // Match list
  matchList: { gap: spacing.lg },

  // FAB
  fab: {
    position: 'absolute', right: spacing.xl,
    backgroundColor: colors.primaryContainer,
    width: 56, height: 56, borderRadius: 28, borderCurve: 'continuous',
    alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
});
