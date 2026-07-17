import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, ExternalLink, ShieldCheck, Calendar, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { VerificationStatus } from "@/components/certificate/VerificationStatus";
import { CertificateDownloadButton } from "@/components/certificate/CertificateDownloadButton";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { QRCodeCard } from "@/components/certificate/QRCodeCard";
import { useCertificateDetail } from "@/hooks/useCertificate";

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: certificate, isLoading, error } = useCertificateDetail(id || "");
  const [showPreview, setShowPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-bold text-zinc-500">Loading certificate details...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
          <Award className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Certificate Not Found
        </h2>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          The certificate you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate("/certificates")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Certificates
        </Button>
      </div>
    );
  }

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const verifyUrl = `${window.location.origin}/verify/${certificate.verificationCode}`;

  const statusLabel = (() => {
    switch (certificate.status) {
      case "GENERATED": return "Active";
      case "REGENERATED": return "Active (Regenerated)";
      case "REVOKED": return "Revoked";
      case "EXPIRED": return "Expired";
      default: return certificate.status;
    }
  })();

  const statusVariant = certificate.status === "REVOKED" || certificate.status === "EXPIRED" ? "danger" : "success";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate Details"
        description={certificate.course.title}
        breadcrumbs={[
          { label: "My Certificates", href: "/certificates" },
          { label: "Certificate Details" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center dark:bg-amber-950/30">
                  <Award className="h-7 w-7 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {certificate.course.title}
                  </h2>
                  <p className="text-xs font-medium text-zinc-500">
                    Instructor: {certificate.course.instructor.name}
                  </p>
                </div>
              </div>
              <VerificationStatus status={certificate.status} size="md" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Issue Date</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{issuedDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                <Hash className="h-4 w-4 text-purple-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Certificate No.</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">#{certificate.certificateNumber}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</p>
                <Badge variant={statusVariant}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                <FileText className="h-4 w-4 text-amber-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Version</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">v{certificate.version}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Verification Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-400 select-all break-all">
                  {certificate.verificationCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(certificate.verificationCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <CertificateDownloadButton
                certificateId={certificate.id}
                disabled={certificate.status === "REVOKED" || certificate.status === "EXPIRED"}
                variant="primary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={!certificate.pdfFile}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/certificates")}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <QRCodeCard
            verificationUrl={verifyUrl}
            verificationCode={certificate.verificationCode}
          />

          <div className="p-5 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/verify/${certificate.verificationCode}`, "_blank")}
                className="w-full justify-start"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={!certificate.pdfFile}
                className="w-full justify-start"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CertificatePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        certificateId={certificate.id}
        downloadUrl={certificate.pdfFile?.url || null}
        title={certificate.course.title}
      />
    </div>
  );
}
