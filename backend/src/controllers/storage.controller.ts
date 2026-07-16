import { Request, Response, NextFunction } from "express";
import path from "path";
import { prisma } from "@/database/client";
import { ServiceContainer } from "@/services";
import { StorageValidator } from "@/services/storage/validators/storage.validator";
import { NotFoundError } from "@/errors/custom-errors";
import {
  StorageUploadException,
  StorageDeleteException,
  SignedURLException,
  MultipartUploadException,
  StorageValidationException,
} from "@/services/storage/errors/storage-exceptions";

export class StorageController {
  // 1. POST /api/v1/storage/upload (Buffer upload)
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new StorageValidationException("No file payload detected in request");
      }

      const uploadType = (req.body.uploadType as string) || "temp";
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;

      // Validate file parameters
      StorageValidator.validateFile(originalName, mimeType, size, uploadType);

      const secureKey = StorageValidator.generateSecureKey(originalName, uploadType);

      // Upload via IStorageService
      const result = await ServiceContainer.storage.upload(req.file.buffer, secureKey, {
        contentType: mimeType,
      });

      // Write to Database
      const fileRecord = await prisma.file.create({
        data: {
          name: path.basename(secureKey),
          originalName,
          mimeType,
          extension: path.extname(originalName).toLowerCase(),
          size,
          bucket: result.bucket as string,
          key: secureKey,
          url: `https://${result.bucket}.s3.amazonaws.com/${secureKey}`,
          uploadedBy: req.user?.userId || null,
        },
      });

      // Create success audit log
      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      await ServiceContainer.audit.log({
        userId: req.user?.userId || null,
        eventType: "STORAGE",
        action: "FILE_UPLOAD_SUCCESS",
        entity: "File",
        entityId: fileRecord.id,
        requestMethod: req.method,
        requestPath: req.originalUrl,
        ipAddress: req.ip || null,
        userAgent: device || null,
        statusCode: 201,
        success: true,
        metadata: { key: secureKey, size },
      });

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: fileRecord,
      });
    } catch (error) {
      // Log failed upload audit log
      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      await ServiceContainer.audit.log({
        userId: req.user?.userId || null,
        eventType: "STORAGE",
        action: "FILE_UPLOAD_FAILED",
        entity: "File",
        entityId: null,
        requestMethod: req.method,
        requestPath: req.originalUrl,
        ipAddress: req.ip || null,
        userAgent: device || null,
        statusCode: 400,
        success: false,
        metadata: { error: (error as Error).message },
      });

      next(new StorageUploadException((error as Error).message));
    }
  }

  // 2. POST /api/v1/storage/upload-url (Get presigned upload URL)
  static async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, mimeType, size, uploadType } = req.body;
      if (!filename || !mimeType || size === undefined || !uploadType) {
        throw new StorageValidationException("Missing required upload settings parameters");
      }

      StorageValidator.validateFile(filename, mimeType, size, uploadType);

      const secureKey = StorageValidator.generateSecureKey(filename, uploadType);
      const bucket = (ServiceContainer.storage as unknown as { config?: { bucket?: string } }).config?.bucket || "indiwebpros-lms-assets";

      // Generate signed URL via IStorageService
      const uploadUrl = await ServiceContainer.storage.getSignedUploadUrl(secureKey, 900);

      // Pre-register File record
      const fileRecord = await prisma.file.create({
        data: {
          name: path.basename(secureKey),
          originalName: filename,
          mimeType,
          extension: path.extname(filename).toLowerCase(),
          size: Number(size),
          bucket,
          key: secureKey,
          url: `https://${bucket}.s3.amazonaws.com/${secureKey}`,
          uploadedBy: req.user?.userId || null,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          fileId: fileRecord.id,
          uploadUrl,
          key: secureKey,
          bucket,
        },
      });
    } catch (error) {
      next(new SignedURLException((error as Error).message));
    }
  }

  // 3. GET /api/v1/storage/download-url/:fileId (Get presigned download URL)
  static async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId as string;
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundError("File not found in metadata registry");
      }

      // Check access permission via AuthorizationService
      const role = req.user?.role || "Student";
      const userId = req.user?.userId || "";
      const isOwner = file.uploadedBy === userId;

      if (role !== "Admin" && !isOwner) {
        throw new SignedURLException("Access denied: You are not authorized to download this file resource");
      }

      const downloadUrl = await ServiceContainer.storage.getSignedDownloadUrl(file.key, 900);

      res.status(200).json({
        success: true,
        data: {
          downloadUrl,
        },
      });
    } catch (error) {
      next(new SignedURLException((error as Error).message));
    }
  }

  // 4. DELETE /api/v1/storage/:fileId (Delete file and record)
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId as string;
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundError("File not found in metadata registry");
      }

      const role = req.user?.role || "Student";
      const userId = req.user?.userId || "";
      const isOwner = file.uploadedBy === userId;

      if (role !== "Admin" && !isOwner) {
        throw new StorageDeleteException("Access denied: You are not authorized to delete this file resource");
      }

      // Delete from S3 via IStorageService
      await ServiceContainer.storage.delete(file.key);

      // Delete from Database
      await prisma.file.delete({
        where: { id: fileId },
      });

      // Audit Log deletion success
      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      await ServiceContainer.audit.log({
        userId: req.user?.userId || null,
        eventType: "STORAGE",
        action: "FILE_DELETE_SUCCESS",
        entity: "File",
        entityId: fileId,
        requestMethod: req.method,
        requestPath: req.originalUrl,
        ipAddress: req.ip || null,
        userAgent: device || null,
        statusCode: 200,
        success: true,
        metadata: { key: file.key },
      });

      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      // Audit log failed deletion
      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      await ServiceContainer.audit.log({
        userId: req.user?.userId || null,
        eventType: "STORAGE",
        action: "FILE_DELETE_FAILED",
        entity: "File",
        entityId: req.params.fileId || null,
        requestMethod: req.method,
        requestPath: req.originalUrl,
        ipAddress: req.ip || null,
        userAgent: device || null,
        statusCode: 400,
        success: false,
        metadata: { error: (error as Error).message },
      });

      next(new StorageDeleteException((error as Error).message));
    }
  }

  // 5. POST /api/v1/storage/multipart/start
  static async startMultipart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, mimeType, size, uploadType } = req.body;
      if (!filename || !mimeType || size === undefined || !uploadType) {
        throw new StorageValidationException("Missing required multipart upload configuration params");
      }

      StorageValidator.validateFile(filename, mimeType, size, uploadType);

      const secureKey = StorageValidator.generateSecureKey(filename, uploadType);
      const bucket = (ServiceContainer.storage as unknown as { config?: { bucket?: string } }).config?.bucket || "indiwebpros-lms-assets";

      // Call IStorageService
      const result = await ServiceContainer.storage.createMultipartUpload(secureKey, mimeType);

      // Pre-register database record
      const fileRecord = await prisma.file.create({
        data: {
          name: path.basename(secureKey),
          originalName: filename,
          mimeType,
          extension: path.extname(filename).toLowerCase(),
          size: Number(size),
          bucket,
          key: secureKey,
          url: `https://${bucket}.s3.amazonaws.com/${secureKey}`,
          uploadedBy: req.user?.userId || null,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          uploadId: result.uploadId,
          key: secureKey,
          fileId: fileRecord.id,
        },
      });
    } catch (error) {
      next(new MultipartUploadException((error as Error).message));
    }
  }

  // 6. POST /api/v1/storage/multipart/part
  static async uploadPart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new StorageValidationException("No part file buffer payload detected");
      }

      const { uploadId, partNumber, key } = req.body;
      if (!uploadId || !partNumber || !key) {
        throw new StorageValidationException("Missing required multipart chunk identifiers (uploadId, partNumber, key)");
      }

      // Call S3 via IStorageService
      const result = await ServiceContainer.storage.uploadPart(
        key,
        uploadId,
        Number(partNumber),
        req.file.buffer
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(new MultipartUploadException((error as Error).message));
    }
  }

  // 7. POST /api/v1/storage/multipart/complete
  static async completeMultipart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, uploadId, parts, fileId } = req.body;
      if (!key || !uploadId || !parts || !fileId) {
        throw new StorageValidationException("Missing required arguments to complete multipart upload");
      }

      // Call complete in S3
      await ServiceContainer.storage.completeMultipartUpload(key, uploadId, parts);

      // Fetch file record
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId },
      });

      res.status(200).json({
        success: true,
        message: "Multipart upload completed successfully",
        data: fileRecord,
      });
    } catch (error) {
      next(new MultipartUploadException((error as Error).message));
    }
  }

  // 8. POST /api/v1/storage/multipart/abort
  static async abortMultipart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, uploadId, fileId } = req.body;
      if (!key || !uploadId || !fileId) {
        throw new StorageValidationException("Missing required arguments to abort multipart upload");
      }

      // Abort in S3
      await ServiceContainer.storage.abortMultipartUpload(key, uploadId);

      // Delete pre-registered record
      await prisma.file.delete({
        where: { id: fileId },
      });

      res.status(200).json({
        success: true,
        message: "Multipart upload aborted and file registration cleaned",
      });
    } catch (error) {
      next(new MultipartUploadException((error as Error).message));
    }
  }
}
