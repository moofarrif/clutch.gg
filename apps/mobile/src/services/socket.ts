import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth';
import type { ServerToClientEvents, ClientToServerEvents } from '@clutch/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }) as TypedSocket;

  socket.on('connect', () => {});
  socket.on('disconnect', () => {});
  socket.on('connect_error', () => {});

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinMatchRoom(matchId: string) {
  getSocket().emit('joinMatchRoom', matchId);
}

export function leaveMatchRoom(matchId: string) {
  getSocket().emit('leaveMatchRoom', matchId);
}
