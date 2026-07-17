import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { AuthCard } from "@/components/auth/shared/AuthCard";
import { AuthHeader } from "@/components/auth/shared/AuthHeader";

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
      setResendStatus("Resending...");
      await resendVerification(emailParam);
      setResendStatus("Verification email resent successfully!");
      setCountdown(60);
    } catch (err: any) {
      setResendStatus("Failed to resend. Please try again later.");
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        showLogo={false}
        illustration={
          <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
          >
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 p-1.5 bg-emerald-500 rounded-full shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.6 }}
            >
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </motion.div>
        }
        title="Check your email"
        subtitle={`We've sent a verification link to`}
      />

      {emailParam && (
        <motion.p
          className="text-center text-sm font-bold text-zinc-900 dark:text-white -mt-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {emailParam}
        </motion.p>
      )}

      <div className="space-y-3">
        <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
            <span className="flex items-center justify-center gap-2">
              Open Mail Client
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </a>

        {emailParam && (
          <>
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
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 text-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {resendStatus}
              </motion.p>
            )}
          </>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <Link
          to={ROUTES.login}
          className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthCard>
  );
}
