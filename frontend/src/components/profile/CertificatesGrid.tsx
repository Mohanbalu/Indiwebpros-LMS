import { Award, Download, ExternalLink, Linkedin, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "react-router-dom";

export interface CertificateItem {
  id: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  status: string;
  verificationUrl?: string;
  pdfUrl?: string;
}

interface CertificatesGridProps {
  certificates: CertificateItem[];
  onDownloadPdf?: (cert: CertificateItem) => void;
  onShareLinkedin?: (cert: CertificateItem) => void;
}

export function CertificatesGrid({
  certificates,
  onDownloadPdf,
  onShareLinkedin,
}: CertificatesGridProps) {
  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Earned Course Certificates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {certificates.length === 0 ? (
          <EmptyState
            icon={<Award className="h-8 w-8 text-zinc-400" />}
            title="No certificates earned yet"
            description="Complete 100% of any enrolled course syllabus to earn verifiable PDF certificates."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-2xl p-5 border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/20 via-white to-zinc-50 dark:from-amber-950/10 dark:via-zinc-900 dark:to-zinc-900 shadow-xs hover:border-amber-300 transition flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verified Certificate</span>
                    </div>
                    <h4 className="text-base font-extrabold text-zinc-900 dark:text-white line-clamp-2">
                      {cert.courseTitle}
                    </h4>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      NO: {cert.certificateNumber}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-500">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link to={`/certificates/${cert.id}`}>
                      <Button
                        size="xs"
                        variant="outline"
                        className="rounded-xl flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider h-8 px-3"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Verify
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onDownloadPdf && onDownloadPdf(cert)}
                      className="rounded-xl flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider h-8 px-3 border-amber-300 text-amber-700 dark:text-amber-400"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <button
                      onClick={() => onShareLinkedin && onShareLinkedin(cert)}
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 transition"
                      title="Share to LinkedIn"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
