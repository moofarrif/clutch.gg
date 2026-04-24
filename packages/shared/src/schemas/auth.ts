import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string(),
});

export const AppleAuthSchema = z.object({
  identityToken: z.string(),
  fullName: z
    .object({
      givenName: z.string().nullable(),
      familyName: z.string().nullable(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type AppleAuthInput = z.infer<typeof AppleAuthSchema>;
