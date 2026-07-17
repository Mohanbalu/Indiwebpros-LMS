import { Award, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VerificationStatus } from "./VerificationStatus";
import type { CertificateListItem } from "@/types/certificate.types";

interface CertificateCardProps {
  certificate: CertificateListItem;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
}

export function CertificateCard({ certificate, onView, onDownload }: CertificateCardProps) {
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-blue-950/10" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center dark:bg-amber-950/30">
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <VerificationStatus status={certificate.status} />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {certificate.course.title}
          </h3>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Issued {issuedDate}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          <span>#{certificate.certificateNumber}</span>
          <span>v{certificate.version}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onView(certificate.id)}
            className="flex-1"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(certificate.id)}
            disabled={!certificate.pdfFile}
            className="flex-shrink-0"
            aria-label="Download certificate"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
