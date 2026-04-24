import { Injectable, Logger } from '@nestjs/common';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { StorageProvider, UploadResult } from './storage.interface';

@Injectable()
export class LocalStorageAdapter implements StorageProvider {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async upload(buffer: Buffer, options?: {
    folder?: string;
    filename?: string;
  }): Promise<UploadResult> {
    const folder = options?.folder ?? 'avatars';
    const dir = join(this.uploadDir, folder);
    await mkdir(dir, { recursive: true });

    const filename = (options?.filename ?? randomUUID()) + '.webp';
    const filepath = join(dir, filename);
    await writeFile(filepath, buffer);

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`;
    const url = `${baseUrl}/uploads/${folder}/${filename}`;
    this.logger.log(`File saved: ${url}`);

    return {
      url,
      publicId: `${folder}/${filename}`,
    };
  }

  async delete(publicId: string): Promise<void> {
    const filepath = join(this.uploadDir, publicId);
    try {
      await unlink(filepath);
    } catch {}
  }
}
