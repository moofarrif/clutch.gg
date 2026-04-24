import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { StorageProvider, UploadResult } from './storage.interface';

@Injectable()
export class CloudinaryAdapter implements StorageProvider {
  private readonly logger = new Logger(CloudinaryAdapter.name);

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(buffer: Buffer, options?: {
    folder?: string;
    filename?: string;
    transformation?: { width?: number; height?: number; crop?: string };
  }): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const transform = options?.transformation
        ? { width: options.transformation.width, height: options.transformation.height, crop: options.transformation.crop ?? 'fill', quality: 'auto', fetch_format: 'webp' }
        : { width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'webp' };

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ?? 'clutch/avatars',
          public_id: options?.filename,
          transformation: transform,
          format: 'webp',
          quality: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Upload failed', error);
            reject(error ?? new Error('Upload failed'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
