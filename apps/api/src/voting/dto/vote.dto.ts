import { createZodDto } from 'nestjs-zod';
import { VoteResultSchema } from '@clutch/shared';

export class VoteDto extends createZodDto(VoteResultSchema) {}
