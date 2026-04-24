import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  birthDate: z.string().date().optional(),
  city: z.string().min(2).max(100).optional(),
  photoUrl: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
