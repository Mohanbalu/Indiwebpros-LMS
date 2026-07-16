import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

export default function EmailSent() {
  const { resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(0);
  const [resendStatus, setResendStatus] = useState("");

  const emailParam = searchParams.get("email") || "";

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!emailParam) return;
    try {
      setResendStatus("Resending verification email...");
      await resendVerification(emailParam);
      setResendStatus("✓ Resent successfully!");
      setCountdown(60);
    } catch (err: any) {
      setResendStatus("Failed to resend. Please try again later.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md text-center">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Confirm Your Email</h1>
      </div>

      <div className="py-6">
        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6">
          <Mail className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Verification Email Sent</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          We've sent a secure verification link to <span className="font-bold text-zinc-900 dark:text-zinc-100">{emailParam || "your email address"}</span>. Please click the link inside the mail to verify your account.
        </p>

        <div className="mt-8 space-y-4">
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="block w-full">
            <Button className="w-full font-semibold flex items-center justify-center gap-2">
              Open Mail Client <ArrowRight className="h-4 w-4" />
            </Button>
          </a>

          {emailParam && (
            <div>
              <Button
                variant="outline"
                disabled={countdown > 0}
                onClick={handleResend}
                className="w-full text-xs font-semibold"
              >
                {countdown > 0 ? `Resend Link in ${countdown}s` : "Resend Verification Email"}
              </Button>
              {resendStatus && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {resendStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-150 dark:border-zinc-850 pt-4 text-center">
        <Link to={ROUTES.login} className="text-xs text-zinc-500 dark:text-zinc-400 font-bold hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
