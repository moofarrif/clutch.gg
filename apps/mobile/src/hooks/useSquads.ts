import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface Squad {
  id: string;
  name: string;
  tag: string | null;
  avgMmr: number;
  wins: number;
  losses: number;
  createdAt: string;
  memberCount?: number;
}

interface SquadDetail extends Squad {
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    name: string;
    mmr: number;
    photoUrl: string | null;
    city: string | null;
  }>;
}

export function useMySquad() {
  return useQuery({
    queryKey: ['squad', 'me'],
    queryFn: () => api.get('squads/me').json<SquadDetail | null>(),
    staleTime: 60_000,
  });
}

export function useSquadDetail(squadId: string) {
  return useQuery({
    queryKey: ['squad', squadId],
    queryFn: () => api.get(`squads/${squadId}`).json<SquadDetail>(),
    enabled: !!squadId,
    staleTime: 30_000,
  });
}

export function useDiscoverSquads(limit = 20) {
  return useQuery({
    queryKey: ['squads', 'discover', limit],
    queryFn: () => api.get(`squads?limit=${limit}`).json<Squad[]>(),
    staleTime: 60_000,
  });
}

export function useCreateSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; tag?: string }) =>
      api.post('squads', { json: data }).json<Squad>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useJoinSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (squadId: string) =>
      api.post(`squads/${squadId}/join`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useLeaveSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (squadId: string) =>
      api.delete(`squads/${squadId}/leave`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useInviteToSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ squadId, userId }: { squadId: string; userId: string }) => {
      return api.post(`squads/${squadId}/invite`, { json: { userId } }).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
    },
  });
}

export function useRequestToJoinSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (squadId: string) => {
      return api.post(`squads/${squadId}/request`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useSquadPendingInvites(squadId: string) {
  return useQuery({
    queryKey: ['squad', squadId, 'pending-invites'],
    queryFn: () => api.get(`squads/${squadId}/invites`).json<Array<{
      id: string;
      toUserId: string;
      toUserName: string;
      status: string;
    }>>(),
    enabled: !!squadId,
    staleTime: 10_000,
  });
}

export function useMySquadInvites() {
  return useQuery({
    queryKey: ['squad', 'invites', 'me'],
    queryFn: () => api.get('squads/invites/me').json<Array<{
      id: string;
      squadId: string;
      squadName: string;
      fromUserName: string;
      createdAt: string;
    }>>(),
    staleTime: 10_000,
  });
}

export function useSquadRequests(squadId: string) {
  return useQuery({
    queryKey: ['squad', squadId, 'requests'],
    queryFn: () => api.get(`squads/${squadId}/requests`).json<Array<{
      id: string;
      fromUserId: string;
      fromUserName: string;
      fromUserMmr: number;
      fromUserPhotoUrl: string | null;
      createdAt: string;
    }>>(),
    enabled: !!squadId,
    staleTime: 0,
  });
}

export function useAcceptSquadInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      return api.post(`squads/invites/${inviteId}/accept`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
    },
  });
}

export function useRejectSquadInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      return api.delete(`squads/invites/${inviteId}/reject`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ squadId, userId }: { squadId: string; userId: string }) => {
      return api.delete(`squads/${squadId}/members/${userId}`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad'] });
    },
  });
}
