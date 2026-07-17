import { api } from "./api";
import type {
  CertificateListItem,
  CertificateDetail,
  CertificateVerificationResult,
  DownloadCertificateResponse,
} from "@/types/certificate.types";

export const certificateService = {
  getMyCertificates: async (): Promise<CertificateListItem[]> => {
    const res = await api.get("/certificates/my");
    return res.data.data;
  },

  getCertificate: async (id: string): Promise<CertificateDetail> => {
    const res = await api.get(`/certificates/${id}`);
    return res.data.data;
  },

  downloadCertificate: async (id: string): Promise<DownloadCertificateResponse> => {
    const res = await api.get(`/certificates/${id}/download`);
    return res.data.data;
  },

  verifyCertificate: async (verificationCode: string): Promise<CertificateVerificationResult> => {
    const res = await api.get(`/certificates/verify/${verificationCode}`);
    return res.data.data;
  },

  generateStudentCertificate: async (courseId: string): Promise<CertificateDetail> => {
    const res = await api.post("/certificates/generate-student", { courseId });
    return res.data.data;
  },
};
