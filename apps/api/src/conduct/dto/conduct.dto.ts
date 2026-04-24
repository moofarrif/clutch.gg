import { createZodDto } from 'nestjs-zod';
import { RateConductSchema } from '@clutch/shared';

export class RateConductDto extends createZodDto(RateConductSchema) {}
