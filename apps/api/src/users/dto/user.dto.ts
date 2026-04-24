import { createZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@clutch/shared';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
