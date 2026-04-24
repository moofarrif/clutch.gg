import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ── Create Court ──
export const CreateCourtSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  surface: z.string().max(50).optional().default('sintética'),
  photoUrl: z.string().url().optional(),
});

export class CreateCourtDto extends createZodDto(CreateCourtSchema) {}

// ── Update Court ──
export const UpdateCourtSchema = CreateCourtSchema.partial();

export class UpdateCourtDto extends createZodDto(UpdateCourtSchema) {}

// ── Find Courts Query ──
export const FindCourtsQuerySchema = z.object({
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(100).max(50_000).optional().default(5000),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export class FindCourtsQueryDto extends createZodDto(FindCourtsQuerySchema) {}
