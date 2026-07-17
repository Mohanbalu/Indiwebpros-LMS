import { useQuery, useMutation } from "@tanstack/react-query";
import { certificateService } from "@/services/certificate.service";

export function useMyCertificates() {
  return useQuery({
    queryKey: ["myCertificates"],
    queryFn: () => certificateService.getMyCertificates(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCertificateDetail(id: string) {
  return useQuery({
    queryKey: ["certificateDetail", id],
    queryFn: () => certificateService.getCertificate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (id: string) => certificateService.downloadCertificate(id),
  });
}

export function useGenerateStudentCertificate() {
  return useMutation({
    mutationFn: (courseId: string) => certificateService.generateStudentCertificate(courseId),
  });
}

export function useVerifyCertificate(code: string) {
  return useQuery({
    queryKey: ["certificateVerify", code],
    queryFn: () => certificateService.verifyCertificate(code),
    enabled: !!code && code.length >= 32,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
