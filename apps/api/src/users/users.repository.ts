import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user ?? null;
  }

  async findByGoogleId(googleId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.googleId, googleId));
    return user ?? null;
  }

  async findByAppleId(appleId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.appleId, appleId));
    return user ?? null;
  }

  async create(data: Partial<typeof users.$inferInsert>) {
    const [user] = await this.db
      .insert(users)
      .values(data as typeof users.$inferInsert)
      .returning();
    return user;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async updateMmr(id: string, mmr: number) {
    const [user] = await this.db
      .update(users)
      .set({ mmr, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async updateConductScore(id: string, conductScore: number) {
    const [user] = await this.db
      .update(users)
      .set({ conductScore, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }
}
