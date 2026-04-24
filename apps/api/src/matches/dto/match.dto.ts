import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ── Create Match ──
export const CreateMatchSchema = z.object({
  dateTime: z.coerce.date(),
  courtName: z.string().min(1).max(200),
  courtLat: z.number().min(-90).max(90),
  courtLng: z.number().min(-180).max(180),
  maxPlayers: z.number().int().min(2).max(30).optional().default(10),
});

export class CreateMatchDto extends createZodDto(CreateMatchSchema) {}

// ── Find Matches Query ──
export const FindMatchesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(100).max(50_000).optional().default(5000),
  status: z.string().optional().default('open'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export class FindMatchesQueryDto extends createZodDto(FindMatchesQuerySchema) {}
