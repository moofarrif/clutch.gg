import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore, type User } from '../stores/auth';

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const data = await api.get('auth/me').json<User>();
      setUser(data);
      return data;
    },
    staleTime: 120_000,
    initialData: user ?? undefined,
  });

  return query;
}

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      return api.get(`users/${userId}`).json<User>();
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data: { name?: string; city?: string; birthDate?: string; photoUrl?: string }) => {
      return api.patch('users/me', { json: data }).json<User>();
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

interface LeaderboardEntry {
  id: string;
  name: string;
  mmr: number;
  rank: string;
  matchesPlayed: number;
  wins: number;
  photoUrl: string | null;
}

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      return api.get(`users/leaderboard?limit=${limit}`).json<LeaderboardEntry[]>();
    },
    staleTime: 300_000,
  });
}

interface MatchHistoryEntry {
  id: string;
  matchId: string;
  mmrBefore: number;
  mmrAfter: number;
  createdAt: string;
  match: {
    courtName: string;
    dateTime: string;
    result: string;
    status: string;
  };
}

export function useMatchHistory(userId?: string) {
  return useQuery({
    queryKey: ['match-history', userId],
    queryFn: async () => {
      const endpoint = userId ? `users/${userId}/history` : 'users/me/history';
      return api.get(endpoint).json<MatchHistoryEntry[]>();
    },
    staleTime: 10_000,
  });
}

export function useConductScore(userId: string) {
  return useQuery({
    queryKey: ['conduct', userId],
    queryFn: async () => {
      return api.get(`users/${userId}/conduct`).json<{ score: number; totalRatings: number }>();
    },
    enabled: !!userId,
    staleTime: 300_000,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => api.get(`users/search?q=${encodeURIComponent(query)}`).json<Array<{
      id: string;
      name: string;
      mmr: number;
      photoUrl: string | null;
      city: string | null;
    }>>(),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}
