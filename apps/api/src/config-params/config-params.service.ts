import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider';
import { config } from '../database/schema';
import { eq } from 'drizzle-orm';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

const DEFAULT_CONFIG: Record<string, unknown> = {
  // Match
  max_players: 10,
  team_size: 5,
  vote_threshold: 0.6,
  min_hours_ahead: 5,
  nearby_radius_km: 50,
  // ELO
  initial_mmr: 1000,
  mmr_variance: 0.2,
  k_factor_new: 32,
  k_factor_veteran: 16,
  veteran_threshold: 20,
  // Squad
  max_squad_members: 5,
};

@Injectable()
export class ConfigParamsService implements OnModuleInit {
  private readonly logger = new Logger(ConfigParamsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async onModuleInit(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      const existing = await this.db
        .select()
        .from(config)
        .where(eq(config.key, key))
        .limit(1);

      if (existing.length === 0) {
        await this.db.insert(config).values({ key, value });
        this.logger.log(`Seeded config: ${key} = ${JSON.stringify(value)}`);
      }
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.db.select().from(config);
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
      this.cache.set(row.key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return result;
  }

  async get(key: string): Promise<unknown> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Read from DB
    const [row] = await this.db
      .select()
      .from(config)
      .where(eq(config.key, key))
      .limit(1);

    if (!row) return undefined;

    // Store in cache
    this.cache.set(key, {
      value: row.value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return row.value;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.db
      .insert(config)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: config.key,
        set: { value, updatedAt: new Date() },
      });

    // Update cache
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }
}
