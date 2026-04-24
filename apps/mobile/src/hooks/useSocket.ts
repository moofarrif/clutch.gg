import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinMatchRoom, leaveMatchRoom } from '../services/socket';
import type { ServerToClientEvents } from '@clutch/shared';

export function useMatchSocket(matchId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matchId) return;

    const socket = getSocket();
    joinMatchRoom(matchId);

    const onPlayerJoined: ServerToClientEvents['playerJoined'] = (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    };

    const onPlayerLeft: ServerToClientEvents['playerLeft'] = (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    };

    const onDraftComplete: ServerToClientEvents['draftComplete'] = (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    };

    const onMatchUpdate: ServerToClientEvents['matchUpdate'] = (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
    };

    const onMatchResult: ServerToClientEvents['matchResult'] = (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    };

    const onMatchStatusChanged = (_data: { matchId: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'infinite'] });
    };

    socket.on('playerJoined', onPlayerJoined);
    socket.on('playerLeft', onPlayerLeft);
    socket.on('draftComplete', onDraftComplete);
    socket.on('matchUpdate', onMatchUpdate);
    socket.on('matchResult', onMatchResult);
    socket.on('matchStatusChanged', onMatchStatusChanged);

    return () => {
      leaveMatchRoom(matchId);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('draftComplete', onDraftComplete);
      socket.off('matchUpdate', onMatchUpdate);
      socket.off('matchResult', onMatchResult);
      socket.off('matchStatusChanged', onMatchStatusChanged);
    };
  }, [matchId, queryClient]);
}
