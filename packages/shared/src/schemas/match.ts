import { z } from 'zod';

export const CreateMatchSchema = z.object({
  dateTime: z.string().datetime(),
  courtName: z.string().min(2).max(200),
  courtLat: z.number().min(-90).max(90),
  courtLng: z.number().min(-180).max(180),
});

export const VoteResultSchema = z.object({
  vote: z.enum(['team_a', 'team_b']),
  scoreA: z.number().int().min(0).max(99).optional(),
  scoreB: z.number().int().min(0).max(99).optional(),
});

export const RateConductSchema = z.object({
  ratings: z.array(
    z.object({
      userId: z.string().uuid(),
      score: z.number().int().min(1).max(5),
    })
  ),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;
export type VoteResultInput = z.infer<typeof VoteResultSchema>;
export type RateConductInput = z.infer<typeof RateConductSchema>;
