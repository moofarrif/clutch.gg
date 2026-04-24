import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface Friend {
  friendshipId: string;
  friendId: string;
  friendName: string;
  friendMmr: number;
  friendPhotoUrl: string | null;
  friendCity: string | null;
  createdAt: string;
}

interface FriendRequest {
  friendshipId: string;
  requesterId: string;
  requesterName: string;
  requesterMmr: number;
  requesterPhotoUrl: string | null;
  createdAt: string;
}

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('friends').json<Friend[]>(),
    staleTime: 60_000,
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: () => api.get('friends/requests').json<FriendRequest[]>(),
    staleTime: 0,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post('friends/request', { json: { userId } }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post(`friends/${friendshipId}/accept`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post(`friends/${friendshipId}/reject`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete(`friends/${friendshipId}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}
