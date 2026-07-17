import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { CertificateGrid } from "@/components/certificate/CertificateGrid";
import { useMyCertificates, useDownloadCertificate } from "@/hooks/useCertificate";

export default function MyCertificates() {
  const navigate = useNavigate();
  const { data: certificates, isLoading } = useMyCertificates();
  const downloadMutation = useDownloadCertificate();

  const handleView = useCallback(
    (id: string) => {
      navigate(`/certificates/${id}`);
    },
    [navigate]
  );

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        const { url } = await downloadMutation.mutateAsync(id);
        if (url) {
          window.open(url, "_blank");
        }
      } catch { /* noop */ }
    },
    [downloadMutation]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Certificates"
        description="View and download your earned certificates."
      />

      <CertificateGrid
        certificates={certificates || []}
        isLoading={isLoading}
        onView={handleView}
        onDownload={handleDownload}
      />
    </div>
  );
}
