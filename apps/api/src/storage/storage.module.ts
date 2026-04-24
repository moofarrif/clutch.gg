import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.interface';
import { CloudinaryAdapter } from './cloudinary.adapter';
import { LocalStorageAdapter } from './local.adapter';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cloudName = config.get('CLOUDINARY_CLOUD_NAME');
        if (cloudName) {
          return new CloudinaryAdapter(config);
        }
        // Fallback to local storage in dev
        return new LocalStorageAdapter();
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
