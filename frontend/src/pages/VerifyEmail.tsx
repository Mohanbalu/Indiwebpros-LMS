import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertTriangle, RefreshCw, ArrowRight, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { AuthCard } from "@/components/auth/shared/AuthCard";
import { AuthHeader } from "@/components/auth/shared/AuthHeader";

export default function VerifyEmail() {
  const { resendVerification } = useAuth();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [countdown, setCountdown] = useState(0);
  const [resendStatus, setResendStatus] = useState("");

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const verify = async () => {
    if (!token) {
      setLoading(false);
      setErrorMsg("Verification token is missing from the URL. The link may be incomplete.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.get(`/auth/verify-email?token=${token}`);
      if (res?.data?.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res?.data?.message || "Verification failed. The link may have expired.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Verification failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, [token]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!emailParam) {
      setResendStatus("Email parameter is missing. Cannot resend.");
      return;
    }

    try {
      setResendStatus("Sending...");
      await resendVerification(emailParam);
      setResendStatus("Verification email resent successfully!");
      setCountdown(60);
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || "Failed to resend. Please try again later.");
    }
  };

  return (
    <AuthCard>
      {loading ? (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="inline-flex p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </motion.div>
          <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
            Verifying your email
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Please wait while we verify your email address...
          </p>
        </motion.div>
      ) : success ? (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
          >
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
            Email verified
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
            Your email has been successfully verified. You can now access your account and start learning.
          </p>
          <Link to={ROUTES.login} className="block mt-8">
            <Button className="w-full py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
          >
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </motion.div>
          <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
            Verification failed
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
            {errorMsg || "The verification link has expired or is invalid. Please request a new verification email."}
          </p>

          {emailParam && (
            <div className="mt-8 space-y-3">
              <Button
                variant="outline"
                disabled={countdown > 0}
                onClick={handleResend}
                className="w-full py-3 text-sm font-bold rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <MailCheck className="h-4 w-4" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Email"}
                </span>
              </Button>
              {resendStatus && (
                <motion.p
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {resendStatus}
                </motion.p>
              )}
            </div>
          )}

          <Link to={ROUTES.login} className="block mt-6">
            <Button variant="ghost" className="w-full py-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200">
              <span className="flex items-center justify-center gap-1.5">
                Back to Sign In
              </span>
            </Button>
          </Link>
        </motion.div>
      )}
    </AuthCard>
  );
}
