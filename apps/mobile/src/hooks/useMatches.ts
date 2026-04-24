import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface Match {
  id: string;
  creatorId: string;
  dateTime: string;
  courtName: string;
  courtLat: number;
  courtLng: number;
  status: string;
  maxPlayers: number;
  result: string | null;
  distance?: number;
  playerCount?: number;
  player_count?: number;
  courtPhoto?: string | null;
}

interface MatchDetail extends Match {
  players: Array<{
    userId: string;
    team: string | null;
    joinedAt: string;
    confirmed?: boolean;
    user: { id: string; name: string; mmr: number; photoUrl: string | null };
  }>;
}

export function useMatchesNearby(lat: number, lng: number, radius = 30000) {
  return useQuery({
    queryKey: ['matches', 'nearby', lat, lng, radius],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
        status: 'open',
      });
      return api.get(`matches?${params}`).json<Match[]>();
    },
    enabled: lat !== 0 && lng !== 0,
    staleTime: 30_000,
  });
}

const PAGE_SIZE = 5;

export function useMatchesList(status?: string) {
  return useQuery({
    queryKey: ['matches', 'list', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      return api.get(`matches${params}`).json<Match[]>();
    },
    staleTime: 30_000,
  });
}

export function useMatchesInfinite(status = 'open') {
  return useInfiniteQuery({
    queryKey: ['matches', 'infinite', status],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        status,
        page: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      return api.get(`matches?${params}`).json<Match[]>();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useMatchDetail(matchId: string) {
  return useQuery({
    queryKey: ['matches', matchId],
    queryFn: async () => {
      return api.get(`matches/${matchId}`).json<MatchDetail>();
    },
    enabled: !!matchId,
    staleTime: 0,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { dateTime: string; courtName: string; courtLat: number; courtLng: number }) => {
      return api.post('matches', { json: data }).json<Match>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      return api.post(`matches/${matchId}/join`).json<{ count: number; isFull: boolean }>();
    },
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'list'] });
    },
  });
}

export function useLeaveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      return api.post(`matches/${matchId}/leave`).json();
    },
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
    },
  });
}

export function useVoteResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, vote, scoreA, scoreB }: {
      matchId: string;
      vote: 'team_a' | 'team_b';
      scoreA?: number;
      scoreB?: number;
    }) => {
      return api.post(`matches/${matchId}/vote`, { json: { vote, scoreA, scoreB } }).json();
    },
    onSuccess: (_data, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    },
  });
}

export function useRateConduct() {
  return useMutation({
    mutationFn: async ({ matchId, ratings }: { matchId: string; ratings: Array<{ userId: string; score: number }> }) => {
      return api.post(`matches/${matchId}/rate`, { json: { ratings } }).json();
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      return api.delete(`matches/${matchId}`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useConfirmAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      return api.post(`matches/${matchId}/confirm`).json();
    },
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    },
  });
}
