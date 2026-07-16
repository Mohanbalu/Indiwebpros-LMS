import { vi } from "vitest";

// S3 Storage provider mock fully implementing IStorageService
export const mockS3StorageProvider = {
  initialize: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
  health: vi.fn().mockResolvedValue({ status: "healthy", latency: 5, message: "Storage active" }),

  upload: vi
    .fn()
    .mockImplementation(async (file: Buffer, path: string, options?: Record<string, unknown>) => {
      return {
        bucket: "indiwebpros-lms-test-bucket",
        key: path,
        url: `https://indiwebpros-lms-test-bucket.s3.amazonaws.com/${path}`,
      };
    }),
  delete: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(true),
  getSignedDownloadUrl: vi
    .fn()
    .mockImplementation(async (path: string, expiresSeconds?: number) => {
      return `https://indiwebpros-lms-test-bucket.s3.amazonaws.com/${path}?Expires=${expiresSeconds || 3600}`;
    }),
  getSignedUploadUrl: vi.fn().mockImplementation(async (path: string, expiresSeconds?: number) => {
    return `https://indiwebpros-lms-test-bucket.s3.amazonaws.com/${path}?Signature=mock`;
  }),
  copy: vi.fn().mockResolvedValue(undefined),
  move: vi.fn().mockResolvedValue(undefined),
  getMetadata: vi.fn().mockResolvedValue({ size: 1024, mimeType: "video/mp4" }),
  createMultipartUpload: vi.fn().mockResolvedValue({ uploadId: "mock-upload-id", key: "mock-key" }),
  uploadPart: vi.fn().mockResolvedValue({ ETag: "mock-etag", PartNumber: 1 }),
  completeMultipartUpload: vi.fn().mockResolvedValue({ success: true }),
  abortMultipartUpload: vi.fn().mockResolvedValue(undefined),
};
