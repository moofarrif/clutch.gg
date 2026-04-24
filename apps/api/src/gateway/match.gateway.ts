import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS?.split(',') ?? [])
      : true,
    credentials: true,
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MatchGateway.name);
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  @WebSocketServer()
  server!: Server;

  /** Maps userId -> socketId for direct messaging */
  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      // Clean orphaned sockets
      for (const [userId, socketId] of this.userSockets.entries()) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          this.userSockets.delete(userId);
        }
      }
    }, 60000); // every 60s
  }

  onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret });

      // Attach userId to socket data
      client.data.userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);

      this.logger.log(`User ${payload.sub} connected (socket ${client.id})`);
    } catch (err) {
      this.logger.warn(`Auth failed for socket ${client.id}: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    }
  }

  @SubscribeMessage('joinMatchRoom')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ): void {
    client.join(`match:${matchId}`);
    this.logger.log(`Socket ${client.id} joined room match:${matchId}`);
  }

  @SubscribeMessage('leaveMatchRoom')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ): void {
    client.leave(`match:${matchId}`);
    this.logger.log(`Socket ${client.id} left room match:${matchId}`);
  }

  /** Expose userSockets map for GatewayService */
  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
