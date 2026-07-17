import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDownloadCertificate } from "@/hooks/useCertificate";

interface CertificateDownloadButtonProps {
  certificateId: string;
  disabled?: boolean;
  variant?: "primary" | "outline";
  className?: string;
  onDownloadStart?: () => void;
  onDownloadEnd?: () => void;
}

export function CertificateDownloadButton({
  certificateId,
  disabled,
  variant = "primary",
  className,
  onDownloadStart,
  onDownloadEnd,
}: CertificateDownloadButtonProps) {
  const downloadMutation = useDownloadCertificate();

  const handleDownload = useCallback(async () => {
    if (downloadMutation.isPending) return;
    onDownloadStart?.();
    try {
      const { url } = await downloadMutation.mutateAsync(certificateId);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = "certificate.pdf";
        link.click();
      }
    } catch {
      // Error handled by React Query
    } finally {
      onDownloadEnd?.();
    }
  }, [certificateId, downloadMutation, onDownloadStart, onDownloadEnd]);

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleDownload}
      disabled={disabled || downloadMutation.isPending}
      isLoading={downloadMutation.isPending}
      className={className}
      aria-label="Download certificate PDF"
    >
      <Download className="h-4 w-4 mr-1.5" />
      {downloadMutation.isPending ? "Preparing..." : "Download PDF"}
    </Button>
  );
}
