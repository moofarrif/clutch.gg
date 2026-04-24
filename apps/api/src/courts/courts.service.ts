import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { courts } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CreateCourtDto } from './dto/court.dto';
import { UpdateCourtDto } from './dto/court.dto';

@Injectable()
export class CourtsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(query: {
    city?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;

    // Nearby search using Haversine
    if (query.lat != null && query.lng != null) {
      const radiusMeters = query.radius ?? 5000;

      const rows = await this.db.execute(sql`
        SELECT *,
          (6371000 * acos(
            cos(radians(${query.lat})) * cos(radians(lat))
            * cos(radians(lng) - radians(${query.lng}))
            + sin(radians(${query.lat})) * sin(radians(lat))
          )) AS distance
        FROM courts
        WHERE active = true
          AND (6371000 * acos(
            cos(radians(${query.lat})) * cos(radians(lat))
            * cos(radians(lng) - radians(${query.lng}))
            + sin(radians(${query.lat})) * sin(radians(lat))
          )) < ${radiusMeters}
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${offset}
      `);

      // Map snake_case from raw SQL to camelCase for frontend
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        city: r.city,
        lat: r.lat,
        lng: r.lng,
        surface: r.surface,
        photoUrl: r.photo_url,
        verified: r.verified,
        active: r.active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        distance: r.distance,
      }));
    }

    // Filter by city
    if (query.city) {
      return this.db
        .select()
        .from(courts)
        .where(and(eq(courts.active, true), eq(courts.city, query.city)))
        .orderBy(courts.name)
        .limit(limit)
        .offset(offset);
    }

    // Default: all active courts
    return this.db
      .select()
      .from(courts)
      .where(eq(courts.active, true))
      .orderBy(courts.name)
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string) {
    const [court] = await this.db.select().from(courts).where(eq(courts.id, id));
    if (!court) throw new NotFoundException('Cancha no encontrada');
    return court;
  }

  async create(dto: CreateCourtDto) {
    const [court] = await this.db.insert(courts).values({
      name: dto.name,
      address: dto.address,
      city: dto.city,
      lat: dto.lat,
      lng: dto.lng,
      surface: dto.surface,
      photoUrl: dto.photoUrl,
    }).returning();

    return court;
  }

  async update(id: string, dto: UpdateCourtDto) {
    // Ensure it exists
    await this.findById(id);

    const [updated] = await this.db
      .update(courts)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(courts.id, id))
      .returning();

    return updated;
  }

  async deactivate(id: string) {
    // Ensure it exists
    await this.findById(id);

    const [deactivated] = await this.db
      .update(courts)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(courts.id, id))
      .returning();

    return deactivated;
  }
}
