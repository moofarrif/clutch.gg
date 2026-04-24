import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { generateInitialMmr } from '@clutch/shared';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { users } from '../database/schema';
import { REDIS } from '../redis/redis.module';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';

const REFRESH_PREFIX = 'refresh:';
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const mmr = generateInitialMmr();

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      mmr,
    });

    const tokens = await this.generateTokenPair(user.id, user.email);
    const { passwordHash: _, ...profile } = user;
    return { user: profile, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokenPair(user.id, user.email);
    const { passwordHash: _, ...profile } = user;
    return { user: profile, ...tokens };
  }

  async googleAuth(dto: GoogleAuthDto) {
    // Verify Google idToken cryptographically
    const { OAuth2Client } = await import('google-auth-library');
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(googleClientId);

    let decoded: { sub: string; email: string; name?: string; picture?: string };
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload?.email) {
        throw new Error('Missing payload');
      }
      decoded = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    let user = await this.usersService.findByGoogleId(decoded.sub);
    if (!user) {
      // Check if email already exists
      const existingByEmail = await this.usersService.findByEmail(decoded.email);
      if (existingByEmail) {
        // Link Google account to existing user
        const [updated] = await this.db
          .update(users)
          .set({ googleId: decoded.sub, updatedAt: new Date() })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        user = updated;
      } else {
        user = await this.usersService.create({
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          googleId: decoded.sub,
          photoUrl: decoded.picture || null,
          mmr: generateInitialMmr(),
        });
      }
    }

    const tokens = await this.generateTokenPair(user.id, user.email);
    const { passwordHash: _, ...profile } = user;
    return { user: profile, ...tokens };
  }

  async refreshTokens(userId: string, currentRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new ForbiddenException('Access denied');

    // Decode token to get jti
    const decoded = this.jwtService.decode(currentRefreshToken) as { sub: string; jti: string } | null;
    if (!decoded?.jti) throw new UnauthorizedException('Invalid token');

    // Lookup in Redis — O(1) instead of DB query
    const key = `${REFRESH_PREFIX}${decoded.jti}`;
    const stored = await this.redis.get(key);
    if (!stored) throw new UnauthorizedException('Token revoked or expired');

    // Parse stored data
    const { tokenHash, storedUserId } = JSON.parse(stored);
    if (storedUserId !== userId) throw new UnauthorizedException('Token mismatch');

    // Single bcrypt compare
    const isValid = await bcrypt.compare(currentRefreshToken, tokenHash);
    if (!isValid) throw new UnauthorizedException('Invalid token');

    // Delete old token (rotation)
    await this.redis.del(key);

    return this.generateTokenPair(user.id, user.email);
  }

  async logout(userId: string) {
    // Delete all refresh tokens for this user
    const keys = await this.redis.keys(`${REFRESH_PREFIX}*`);
    if (keys.length === 0) return;

    // Check each key's userId — use pipeline for efficiency
    const pipeline = this.redis.pipeline();
    keys.forEach((k) => pipeline.get(k));
    const results = await pipeline.exec();

    const keysToDelete: string[] = [];
    results?.forEach(([err, val], i) => {
      if (!err && val) {
        try {
          const data = JSON.parse(val as string);
          if (data.storedUserId === userId) keysToDelete.push(keys[i]);
        } catch {}
      }
    });

    if (keysToDelete.length > 0) {
      await this.redis.del(...keysToDelete);
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  async generateTokenPair(userId: string, email: string) {
    const tokenId = randomUUID();
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync({ ...payload, jti: tokenId }, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    // Store hashed refresh token in Redis with TTL (auto-expires)
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const key = `${REFRESH_PREFIX}${tokenId}`;
    await this.redis.set(
      key,
      JSON.stringify({ tokenHash, storedUserId: userId }),
      'EX',
      REFRESH_TTL,
    );

    return { accessToken, refreshToken };
  }
}
