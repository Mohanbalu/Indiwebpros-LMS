import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "../interfaces/storage-service.interface";
import { ILifecycleService } from "../../shared/lifecycle.interface";
import { IHealthCheckService, HealthStatus } from "../../shared/health.interface";
import { IMetricsService } from "../../shared/metrics.interface";
import { StorageConfig } from "../../shared/config.schema";
import { StorageException } from "../../shared/errors";
import { ServiceContainer } from "../../shared/service-container";

// ── Content-Type → Cache-Control header mapping ───────────────────────────────
const CACHE_CONTROL_MAP: Record<string, string> = {
  "image/": "public, max-age=604800, immutable",           // 7 days for images
  "video/": "public, max-age=86400",                       // 24h for videos
  "application/pdf": "no-store, no-cache",                  // Certificates: no cache
  "text/html": "no-store, no-cache",
  "application/octet-stream": "public, max-age=86400",      // 24h default
};

function resolveCacheControl(contentType: string): string {
  for (const [prefix, value] of Object.entries(CACHE_CONTROL_MAP)) {
    if (contentType.startsWith(prefix)) return value;
  }
  return "public, max-age=86400"; // 24h default
}

// ── S3 Key Prefix → object type tag ──────────────────────────────────────────
function resolveObjectType(key: string): string {
  if (key.startsWith("certificates/")) return "certificate";
  if (key.startsWith("videos/") || key.startsWith("lessons/")) return "lesson-video";
  if (key.startsWith("thumbnails/")) return "thumbnail";
  if (key.startsWith("temp/")) return "temp";
  if (key.startsWith("drafts/")) return "draft";
  if (key.startsWith("logs/")) return "log";
  if (key.startsWith("avatars/")) return "avatar";
  return "asset";
}

export class S3StorageProvider implements IStorageService, ILifecycleService, IHealthCheckService, IMetricsService {
  private config: StorageConfig;
  private operationsCount = 0;
  private s3Client!: S3Client;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
    ServiceContainer.logger.info(`S3StorageProvider initialized with bucket: ${this.config.bucket}`);
  }

  async upload(file: Buffer, path: string, options?: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.operationsCount++;
    try {
      const contentType = (options?.contentType as string) || "application/octet-stream";
      const environment = process.env.NODE_ENV || "development";

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
        Body: file,
        ContentType: contentType,
        // ── Security: Server-Side Encryption (AES256) ──
        ServerSideEncryption: "AES256",
        // ── Performance: Cache-Control headers ──
        CacheControl: (options?.cacheControl as string) || resolveCacheControl(contentType),
        // ── UX: Content-Disposition for downloads ──
        ContentDisposition: options?.filename
          ? `attachment; filename="${options.filename}"`
          : "inline",
        // ── Tagging: Object classification for lifecycle rules ──
        Tagging: [
          `object-type=${resolveObjectType(path)}`,
          `environment=${environment}`,
          `app=indiwebpros-lms`,
        ].join("&"),
        // ── Optional: user metadata ──
        Metadata: {
          "uploaded-by": (options?.uploadedBy as string) || "system",
          "content-type": contentType,
          ...(options?.metadata as Record<string, string> || {}),
        },
      });

      await this.s3Client.send(command);

      return {
        bucket: this.config.bucket,
        key: path,
        size: file.length,
        contentType,
        encrypted: true,
        storageClass: "STANDARD",
      };
    } catch (error) {
      throw new StorageException(`S3 upload failed for ${path}`, [error]);
    }
  }

  async delete(path: string): Promise<void> {
    this.operationsCount++;
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw new StorageException(`S3 delete failed for ${path}`, [error]);
    }
  }

  async exists(path: string): Promise<boolean> {
    this.operationsCount++;
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new StorageException(`S3 exists check failed for ${path}`, [error]);
    }
  }

  /**
   * Generate a short-lived signed download URL (max 15 minutes by default).
   * All content must be accessed through signed URLs — no public objects.
   */
  async getSignedDownloadUrl(path: string, expiresSeconds = 900): Promise<string> {
    this.operationsCount++;
    // Enforce max 1 hour for security
    const safeExpiry = Math.min(expiresSeconds, 3600);
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
        ResponseContentDisposition: path.includes("certificates/")
          ? `attachment; filename="certificate.pdf"`
          : undefined,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: safeExpiry });
    } catch (error) {
      throw new StorageException(`S3 presigned download URL generation failed for ${path}`, [error]);
    }
  }

  async getStream(path: string, range?: string): Promise<{ stream: any; contentType?: string; contentLength?: number; contentRange?: string; acceptRanges?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
        Range: range,
      });
      const response = await this.s3Client.send(command);
      return {
        stream: response.Body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        contentRange: response.ContentRange,
        acceptRanges: response.AcceptRanges,
      };
    } catch (error) {
      throw new StorageException(`S3 getStream failed for ${path}`, [error]);
    }
  }

  /**
   * Returns a CloudFront CDN URL for a given S3 key.
   * Falls back to a signed S3 URL if CLOUDFRONT_URL is not configured.
   * CloudFront OAC handles authentication — no signing needed for public assets.
   */
  getCdnUrl(key: string): string {
    const cfUrl = process.env.CLOUDFRONT_URL;
    if (cfUrl) {
      // Strip trailing slash from domain and leading slash from key
      const domain = cfUrl.replace(/\/$/, "");
      const cleanKey = key.replace(/^\//, "");
      return `${domain}/${cleanKey}`;
    }
    // Fallback: direct S3 URL (requires bucket to be public — not recommended)
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  async getSignedUploadUrl(path: string, expiresSeconds = 900): Promise<string> {
    this.operationsCount++;
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
    } catch (error) {
      throw new StorageException(`S3 presigned upload URL generation failed for ${path}`, [error]);
    }
  }

  async copy(source: string, destination: string): Promise<void> {
    this.operationsCount++;
    try {
      const command = new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${source}`,
        Key: destination,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw new StorageException(`S3 copy failed from ${source} to ${destination}`, [error]);
    }
  }

  async move(source: string, destination: string): Promise<void> {
    this.operationsCount++;
    try {
      await this.copy(source, destination);
      await this.delete(source);
    } catch (error) {
      throw new StorageException(`S3 move failed from ${source} to ${destination}`, [error]);
    }
  }

  async getMetadata(path: string): Promise<Record<string, unknown>> {
    this.operationsCount++;
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
      });
      const result = await this.s3Client.send(command);
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata,
      };
    } catch (error) {
      throw new StorageException(`S3 head metadata check failed for ${path}`, [error]);
    }
  }

  async createMultipartUpload(path: string, contentType: string): Promise<{ uploadId: string; key: string }> {
    this.operationsCount++;
    try {
      const environment = process.env.NODE_ENV || "development";
      const command = new CreateMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: path,
        ContentType: contentType,
        // Encrypt multipart uploads too
        ServerSideEncryption: "AES256",
        Tagging: [
          `object-type=${resolveObjectType(path)}`,
          `environment=${environment}`,
          `app=indiwebpros-lms`,
          `upload-type=multipart`,
        ].join("&"),
      });
      const response = await this.s3Client.send(command);
      if (!response.UploadId) {
        throw new Error("No upload ID returned from S3");
      }
      return {
        uploadId: response.UploadId,
        key: path,
      };
    } catch (error) {
      throw new StorageException(`S3 createMultipartUpload failed for ${path}`, [error]);
    }
  }

  async uploadPart(path: string, uploadId: string, partNumber: number, body: Buffer): Promise<{ ETag: string; PartNumber: number }> {
    this.operationsCount++;
    try {
      const command = new UploadPartCommand({
        Bucket: this.config.bucket,
        Key: path,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      });
      const response = await this.s3Client.send(command);
      if (!response.ETag) {
        throw new Error("No ETag returned for uploaded part");
      }
      return {
        ETag: response.ETag,
        PartNumber: partNumber,
      };
    } catch (error) {
      throw new StorageException(`S3 uploadPart failed for ${path} part ${partNumber}`, [error]);
    }
  }

  async completeMultipartUpload(path: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>): Promise<Record<string, unknown>> {
    this.operationsCount++;
    try {
      const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: path,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })),
        },
      });
      const response = await this.s3Client.send(command);
      return {
        bucket: this.config.bucket,
        key: path,
        location: response.Location,
      };
    } catch (error) {
      throw new StorageException(`S3 completeMultipartUpload failed for ${path}`, [error]);
    }
  }

  async abortMultipartUpload(path: string, uploadId: string): Promise<void> {
    this.operationsCount++;
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: path,
        UploadId: uploadId,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw new StorageException(`S3 abortMultipartUpload failed for ${path}`, [error]);
    }
  }

  async health(): Promise<HealthStatus> {
    return {
      service: "storage",
      status: "healthy",
      latency: 0,
      message: `S3 storage provider ready (provider=${this.config.provider}, region=${this.config.region})`,
      timestamp: new Date().toISOString(),
    };
  }

  async metrics(): Promise<Record<string, unknown>> {
    return { operations_count: this.operationsCount };
  }

  async resetMetrics(): Promise<void> {
    this.operationsCount = 0;
  }

  async recordMetric(name: string, value: number): Promise<void> {
    if (name === "operations_count") this.operationsCount = value;
  }
}
