import { useParams, Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VerificationStatus } from "@/components/certificate/VerificationStatus";
import { useVerifyCertificate } from "@/hooks/useCertificate";

export default function CertificateVerify() {
  const { code } = useParams<{ code: string }>();
  const { data: result, isLoading, error } = useVerifyCertificate(code || "");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto dark:bg-blue-950/30">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            Certificate Verification
          </h1>
          <p className="text-sm text-zinc-500">
            Verify the authenticity of an IndiWebPros certificate
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 text-center space-y-3">
            <XCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
              Verification Failed
            </h2>
            <p className="text-xs text-red-600 dark:text-red-400/80">
              The verification code is invalid. Please check the code and try again.
            </p>
          </div>
        )}

        {result && (
          <>
            <div className={`p-6 rounded-2xl border text-center space-y-4 ${
              result.isValid
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                : "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
            }`}>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${
                result.isValid
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}>
                {result.isValid ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  {result.isValid ? "Certificate Valid" : "Certificate Invalid"}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {result.isValid
                    ? "This is a valid certificate issued by IndiWebPros Academy."
                    : "This certificate is no longer valid."}
                </p>
              </div>

              <Badge
                variant={result.isValid ? "success" : "danger"}
                className="text-xs px-4 py-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                {result.isValid ? "Verified" : result.status}
              </Badge>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
                Certificate Details
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500">Student</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {result.studentName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500">Course</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 text-right">
                    {result.courseName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500">Status</span>
                  <VerificationStatus status={result.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Issue Date</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {new Date(result.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Visit IndiWebPros
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
