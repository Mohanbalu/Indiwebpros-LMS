import { v4 as uuidv4 } from "uuid";
import path from "path";
import { StorageValidationException } from "../errors/storage-exceptions";

export const UploadTypeFolders: Record<string, string> = {
  avatar: "avatars",
  thumbnail: "course-thumbnails",
  video: "lesson-videos",
  resource: "resources",
  assignment: "assignments",
  submission: "submissions",
  certificate: "certificates",
  paper: "research-papers",
  temp: "temp",
};

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE_GENERAL = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_VIDEO = 500 * 1024 * 1024; // 500MB

export class StorageValidator {
  static validateFile(originalName: string, mimeType: string, size: number, uploadType: string): void {
    if (!originalName || originalName.trim() === "") {
      throw new StorageValidationException("File name cannot be empty");
    }

    if (size <= 0) {
      throw new StorageValidationException("File cannot be empty or corrupted (size <= 0)");
    }

    const ext = path.extname(originalName).toLowerCase();
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".js", ".ts", ".php", ".py", ".pl", ".html", ".htm", ".svg"];
    if (dangerousExtensions.includes(ext)) {
      throw new StorageValidationException(`Dangerous file extension [${ext}] is strictly blocked`);
    }

    if (originalName.includes("..") || originalName.includes("/") || originalName.includes("\\")) {
      throw new StorageValidationException("File name cannot contain path traversal sequences");
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new StorageValidationException(`MIME type [${mimeType}] is not supported`);
    }

    const maxSize = mimeType.startsWith("video/") ? MAX_FILE_SIZE_VIDEO : MAX_FILE_SIZE_GENERAL;
    if (size > maxSize) {
      throw new StorageValidationException(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    if (!UploadTypeFolders[uploadType]) {
      throw new StorageValidationException(`Invalid or unsupported uploadType: ${uploadType}`);
    }
  }

  static generateSecureKey(originalName: string, uploadType: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const folder = UploadTypeFolders[uploadType];
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${folder}/${uuid}-${timestamp}${ext}`;
  }
}
