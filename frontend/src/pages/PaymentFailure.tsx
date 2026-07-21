import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, ArrowLeft, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason") ||
    "The payment process was cancelled or timed out. No funds were debited.";
  const courseId = searchParams.get("courseId") || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/60 via-zinc-50 to-zinc-50 dark:from-rose-950/20 dark:via-zinc-950 dark:to-zinc-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl shadow-2xl shadow-rose-100/60 dark:shadow-rose-950/20 overflow-hidden">

          {/* Error banner */}
          <div className="bg-gradient-to-r from-rose-500 to-red-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_60%)]"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 180 }}
              className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle className="h-9 w-9 text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-white">Payment Failed</h1>
            <p className="text-rose-100 text-sm mt-2 font-medium">
              Don't worry — no charges were made to your account.
            </p>
          </div>

          <div className="p-6 space-y-5">

            {/* Reason */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                What happened
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                {reason}
              </p>
            </div>

            {/* What to try */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/50 space-y-2.5">
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                What to try next
              </p>
              {[
                "Check your internet connection and try again",
                "Ensure your card/UPI has sufficient balance",
                "Try a different payment method",
                "Contact your bank if the issue persists",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {courseId && (
                <Button
                  id="retry-checkout-btn"
                  onClick={() => navigate(`${ROUTES.checkout}?courseId=${courseId}`)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-500/25 text-white"
                  size="lg"
                >
                  <RefreshCw className="h-5 w-5" />
                  Retry Payment
                </Button>
              )}

              <Link to={ROUTES.contact} className="block">
                <Button
                  id="contact-support-btn"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Support
                </Button>
              </Link>

              <Link to={ROUTES.courses} className="block">
                <Button
                  id="back-to-courses-btn"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Browse Courses
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Link
                to={ROUTES.myPayments}
                className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 font-semibold hover:underline transition-colors"
              >
                View payment history →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
