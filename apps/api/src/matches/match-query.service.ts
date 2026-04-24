import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider';
import { matches, matchPlayers, courts } from '../database/schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class MatchQueryService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findNearby(
    lat: number,
    lng: number,
    radiusMeters: number,
    filters: { status?: string; page?: number; limit?: number },
  ) {
    const status = filters.status ?? 'open';
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const page = Math.max(filters.page ?? 1, 1);
    const offset = (page - 1) * limit;

    const result = await this.db.execute(sql`
      SELECT m.*,
        COALESCE(pc.player_count, 0)::int AS player_count,
        c.photo_url AS court_photo,
        (6371000 * acos(
          cos(radians(${lat})) * cos(radians(m.court_lat))
          * cos(radians(m.court_lng) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(m.court_lat))
        )) AS distance
      FROM matches m
      LEFT JOIN (
        SELECT match_id, count(*)::int AS player_count
        FROM match_players
        GROUP BY match_id
      ) pc ON pc.match_id = m.id
      LEFT JOIN courts c ON c.name = m.court_name
      WHERE m.status = ${status}
        AND (6371000 * acos(
          cos(radians(${lat})) * cos(radians(m.court_lat))
          * cos(radians(m.court_lng) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(m.court_lat))
        )) < ${radiusMeters}
      ORDER BY m.date_time ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Map snake_case from raw SQL to camelCase for frontend
    return result.map((r: any) => ({
      id: r.id,
      creatorId: r.creator_id,
      dateTime: new Date(r.date_time).toISOString(),
      courtName: r.court_name,
      courtLat: r.court_lat,
      courtLng: r.court_lng,
      status: r.status,
      maxPlayers: r.max_players,
      result: r.result,
      playerCount: r.player_count,
      courtPhoto: r.court_photo ?? null,
      distance: r.distance,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async findByUser(userId: string) {
    const playerMatches = await this.db
      .select({ matchId: matchPlayers.matchId })
      .from(matchPlayers)
      .where(eq(matchPlayers.userId, userId));

    if (playerMatches.length === 0) return [];

    const matchIds = playerMatches.map((p) => p.matchId);

    const result = await this.db.execute(sql`
      SELECT * FROM matches
      WHERE id = ANY(${matchIds})
      ORDER BY date_time DESC
    `);

    return result.map((r: any) => ({
      id: r.id,
      creatorId: r.creator_id,
      dateTime: new Date(r.date_time).toISOString(),
      courtName: r.court_name,
      courtLat: r.court_lat,
      courtLng: r.court_lng,
      status: r.status,
      maxPlayers: r.max_players,
      result: r.result,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async findByStatus(status: string, page?: number, limit?: number) {
    const safeLimit = Math.min(Math.max(limit ?? 20, 1), 50);
    const safePage = Math.max(page ?? 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const rows = await this.db.execute(sql`
      SELECT m.*,
        COALESCE(pc.player_count, 0)::int AS player_count,
        c.photo_url AS court_photo
      FROM matches m
      LEFT JOIN (
        SELECT match_id, count(*)::int AS player_count
        FROM match_players
        GROUP BY match_id
      ) pc ON pc.match_id = m.id
      LEFT JOIN courts c ON c.name = m.court_name
      WHERE m.status = ${status}
      ORDER BY m.date_time ASC
      LIMIT ${safeLimit} OFFSET ${offset}
    `);

    return rows.map((r: any) => ({
      id: r.id,
      creatorId: r.creator_id,
      dateTime: new Date(r.date_time).toISOString(),
      courtName: r.court_name,
      courtLat: r.court_lat,
      courtLng: r.court_lng,
      status: r.status,
      maxPlayers: r.max_players,
      result: r.result,
      playerCount: r.player_count,
      courtPhoto: r.court_photo ?? null,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }
}
