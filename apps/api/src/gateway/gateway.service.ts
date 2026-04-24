import { Injectable } from '@nestjs/common';
import { MatchGateway } from './match.gateway';

@Injectable()
export class GatewayService {
  constructor(private readonly matchGateway: MatchGateway) {}

  emitToMatch(matchId: string, event: string, data: unknown): void {
    this.matchGateway.server.to(`match:${matchId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    const socketId = this.matchGateway.getUserSocketId(userId);
    if (socketId) {
      this.matchGateway.server.to(socketId).emit(event, data);
    }
  }
}
