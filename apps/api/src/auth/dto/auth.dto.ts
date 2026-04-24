import { createZodDto } from 'nestjs-zod';
import { RegisterSchema, LoginSchema, GoogleAuthSchema } from '@clutch/shared';

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}
