import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider';
import { matches, matchPlayers, users } from '../database/schema';
import { eq, sql } from 'drizzle-orm';
import { GatewayService } from '../gateway/gateway.service';
import { CreateMatchDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gatewayService: GatewayService,
  ) {}

  // ── Create ──
  async create(userId: string, dto: CreateMatchDto) {
    const [match] = await this.db
      .insert(matches)
      .values({
        creatorId: userId,
        dateTime: new Date(dto.dateTime),
        courtName: dto.courtName,
        courtLat: dto.courtLat,
        courtLng: dto.courtLng,
        maxPlayers: dto.maxPlayers,
      })
      .returning();

    // Add creator as first player
    await this.db.insert(matchPlayers).values({
      matchId: match.id,
      userId,
    });

    return match;
  }

  // ── Find By Id ──
  async findById(id: string) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(eq(matches.id, id))
      .limit(1);

    if (!match) throw new NotFoundException('Match not found');

    const players = await this.db
      .select({
        userId: matchPlayers.userId,
        team: matchPlayers.team,
        joinedAt: matchPlayers.joinedAt,
        confirmed: matchPlayers.confirmed,
        name: users.name,
        photoUrl: users.photoUrl,
        mmr: users.mmr,
      })
      .from(matchPlayers)
      .innerJoin(users, eq(matchPlayers.userId, users.id))
      .where(eq(matchPlayers.matchId, id));

    // Nest player data to match frontend MatchDetail type
    const formattedPlayers = players.map((p) => ({
      userId: p.userId,
      team: p.team,
      joinedAt: p.joinedAt,
      confirmed: p.confirmed,
      user: { id: p.userId, name: p.name, mmr: p.mmr, photoUrl: p.photoUrl },
    }));

    // Get court photo
    const [court] = await this.db.execute(sql`SELECT photo_url FROM courts WHERE name = ${match.courtName} LIMIT 1`);
    return { ...match, courtPhoto: (court as any)?.photo_url ?? null, players: formattedPlayers };
  }

  // ── Update Status ──
  async updateStatus(matchId: string, status: string) {
    const [updated] = await this.db
      .update(matches)
      .set({ status, updatedAt: new Date() })
      .where(eq(matches.id, matchId))
      .returning();

    if (!updated) throw new NotFoundException('Match not found');

    this.gatewayService.emitToMatch(matchId, 'matchStatusChanged', {
      matchId,
      status,
    });

    return updated;
  }

  // ── Delete ──
  async delete(matchId: string, userId: string) {
    const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new NotFoundException('Partido no encontrado');
    if (match.creatorId !== userId) throw new ForbiddenException('Solo el creador puede eliminar');

    const playerCount = await this.db.select({ count: sql<number>`count(*)` }).from(matchPlayers).where(eq(matchPlayers.matchId, matchId));
    const count = Number(playerCount[0]?.count ?? 0);
    if (count > 1) throw new BadRequestException('No puedes eliminar un partido con otros jugadores');

    await this.db.delete(matchPlayers).where(eq(matchPlayers.matchId, matchId));
    await this.db.delete(matches).where(eq(matches.id, matchId));
    return { deleted: true };
  }
}
