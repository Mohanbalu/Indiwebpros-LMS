import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

export default function VerifyEmail() {
  const { resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Countdown timer for resending
  const [countdown, setCountdown] = useState(0);
  const [resendStatus, setResendStatus] = useState("");

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const verify = async () => {
    if (!token) {
      setLoading(false);
      setErrorMsg("Verification token parameter is missing in URL link.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.get(`/auth/verify-email?token=${token}`);
      if (res?.data?.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res?.data?.message || "Verification failed. Link may be expired.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Verification failed. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, [token]);

  // Countdown clock tick
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!emailParam) {
      setResendStatus("Email query parameter is missing. Cannot resend.");
      return;
    }

    try {
      setResendStatus("Sending verification mail...");
      await resendVerification(emailParam);
      setResendStatus("✓ Verification email resent successfully!");
      setCountdown(60); // disable for 60 seconds
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || "Failed to resend. Please try again later.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Email Verification</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 space-y-4">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Verifying your email credentials with secure platforms...
          </p>
        </div>
      ) : success ? (
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Verification Complete</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Thank you! Your email address has been successfully verified. You can now access your dashboard portal.
          </p>
          <Link to={ROUTES.login}>
            <Button className="mt-6 w-full">Sign In</Button>
          </Link>
        </div>
      ) : (
        <div className="text-center py-6">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Verification Failed</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed mb-6">
            {errorMsg || "The verification link has expired or is invalid. Please request a new verification email."}
          </p>

          {emailParam && (
            <div className="space-y-4">
              <Button
                variant="outline"
                disabled={countdown > 0}
                onClick={handleResend}
                className="w-full text-xs font-semibold"
              >
                {countdown > 0 ? `Resend Link in ${countdown}s` : "Resend Verification Email"}
              </Button>
              {resendStatus && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {resendStatus}
                </p>
              )}
            </div>
          )}

          <Link to={ROUTES.login}>
            <Button variant="ghost" className="mt-4 w-full">Back to Sign In</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
