import {
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Body,
  Query,
  NotFoundException,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../storage/storage.interface';
import type { StorageProvider } from '../storage/storage.interface';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { users, eloHistory, matches } from '../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  async getMe(@CurrentUser('sub') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...profile } = user;
    return profile;
  }

  @Patch('me')
  @ApiBearerAuth()
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(userId, dto);
    const { passwordHash, ...profile } = user;
    return profile;
  }

  @Get('me/history')
  @ApiBearerAuth()
  async getMyHistory(@CurrentUser('sub') userId: string) {
    const rows = await this.db
      .select({
        id: eloHistory.id,
        matchId: eloHistory.matchId,
        mmrBefore: eloHistory.mmrBefore,
        mmrAfter: eloHistory.mmrAfter,
        createdAt: eloHistory.createdAt,
        courtName: matches.courtName,
        dateTime: matches.dateTime,
        result: matches.result,
        status: matches.status,
        matchStatus: matches.status,
      })
      .from(eloHistory)
      .innerJoin(matches, eq(eloHistory.matchId, matches.id))
      .where(eq(eloHistory.userId, userId))
      .orderBy(desc(eloHistory.createdAt))
      .limit(50);

    // Nest match data to match frontend MatchHistoryEntry type
    return rows.map((r) => ({
      id: r.id,
      matchId: r.matchId,
      mmrBefore: r.mmrBefore,
      mmrAfter: r.mmrAfter,
      createdAt: r.createdAt,
      match: {
        id: r.matchId,
        courtName: r.courtName,
        dateTime: r.dateTime,
        result: r.result,
        status: r.status,
      },
    }));
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search users by name' })
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    if (!query || query.length < 2) return [];
    const take = Math.min(Number(limit) || 10, 20);
    return this.db
      .select({
        id: users.id,
        name: users.name,
        mmr: users.mmr,
        photoUrl: users.photoUrl,
        city: users.city,
      })
      .from(users)
      .where(sql`unaccent(${users.name}) ILIKE unaccent(${'%' + query + '%'}) AND ${users.deletedAt} IS NULL`)
      .orderBy(desc(users.mmr))
      .limit(take);
  }

  @Get('leaderboard')
  @Public()
  async getLeaderboard(@Query('limit') limit?: string) {
    const take = Math.min(Number(limit) || 50, 100);
    return this.db
      .select({
        id: users.id,
        name: users.name,
        mmr: users.mmr,
        matchesPlayed: users.matchesPlayed,
        wins: users.wins,
        losses: users.losses,
        conductScore: users.conductScore,
        photoUrl: users.photoUrl,
        city: users.city,
        reliabilityBadge: users.reliabilityBadge,
      })
      .from(users)
      .orderBy(desc(users.mmr))
      .limit(take);
  }

  @Patch('me/avatar')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Solo se permiten imágenes'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundException('No se envió archivo');

    const result = await this.storage.upload(file.buffer, {
      folder: 'clutch/avatars',
      filename: userId,
      transformation: { width: 400, height: 400, crop: 'fill' },
    });

    await this.db.update(users).set({ photoUrl: result.url, updatedAt: new Date() }).where(eq(users.id, userId));

    return { photoUrl: result.url };
  }

  @Patch('me/preferences')
  @ApiBearerAuth()
  async updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() body: { pushEnabled?: boolean; matchReminder?: boolean; joinNotify?: boolean },
  ) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.pushEnabled !== undefined) updates.pushEnabled = body.pushEnabled;
    if (body.matchReminder !== undefined) updates.matchReminder = body.matchReminder;
    if (body.joinNotify !== undefined) updates.joinNotify = body.joinNotify;

    await this.db.update(users).set(updates).where(eq(users.id, userId));
    return { success: true };
  }

  @Delete('me')
  @ApiBearerAuth()
  async deleteAccount(@CurrentUser('sub') userId: string) {
    // Soft delete: set deletedAt, anonymize data
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        name: 'Usuario eliminado',
        email: 'deleted_' + userId + '@clutch.gg',
        photoUrl: null,
        expoPushToken: null,
        googleId: null,
        appleId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true, message: 'Cuenta eliminada' };
  }

  @Get(':id')
  @Public()
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, email, googleId, appleId, expoPushToken, ...publicProfile } = user;
    return publicProfile;
  }
}
