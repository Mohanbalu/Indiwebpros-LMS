export interface IStorageService {
  upload(file: Buffer, path: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getSignedDownloadUrl(path: string, expiresSeconds?: number): Promise<string>;
  getSignedUploadUrl(path: string, expiresSeconds?: number): Promise<string>;
  copy(source: string, destination: string): Promise<void>;
  move(source: string, destination: string): Promise<void>;
  getMetadata(path: string): Promise<Record<string, unknown>>;
  createMultipartUpload(path: string, contentType: string): Promise<{ uploadId: string; key: string }>;
  uploadPart(path: string, uploadId: string, partNumber: number, body: Buffer): Promise<{ ETag: string; PartNumber: number }>;
  completeMultipartUpload(path: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>): Promise<Record<string, unknown>>;
  abortMultipartUpload(path: string, uploadId: string): Promise<void>;
}
