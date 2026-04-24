export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface StorageProvider {
  upload(buffer: Buffer, options?: {
    folder?: string;
    filename?: string;
    transformation?: { width?: number; height?: number; crop?: string };
  }): Promise<UploadResult>;

  delete(publicId: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
