export type CertificateStatus = "GENERATED" | "REGENERATED" | "REVOKED" | "EXPIRED";

export interface CertificateListItem {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  status: CertificateStatus;
  version: number;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  pdfFile: {
    id: string;
    downloadUrl: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null;
}

export interface CertificateDetail {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  status: CertificateStatus;
  version: number;
  course: {
    id: string;
    title: string;
    slug: string;
    instructor: {
      name: string;
    };
  };
  pdfFile: {
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null;
  qrCodeFile: {
    id: string;
    url: string;
  } | null;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  studentName: string;
  courseName: string;
  status: CertificateStatus;
  issuedAt: string;
}

export interface CertificateFile {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface DownloadCertificateResponse {
  url: string;
}

export type CertificateSortOption = "latest" | "oldest";

export interface CertificateSearchFilters {
  query: string;
  sort: CertificateSortOption;
  status: CertificateStatus | "all";
}
