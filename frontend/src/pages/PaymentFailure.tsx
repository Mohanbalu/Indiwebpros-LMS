import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason") || "The payment verification process was cancelled or timed out.";
  const courseId = searchParams.get("courseId") || "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-8 text-center shadow-sm">
        {/* Error Alert Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500 animate-pulse">
            <AlertCircle className="h-10 w-10" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Payment Failed</h1>
        <p className="text-xs text-zinc-450 dark:text-zinc-450 mb-6">
          We encountered an issue verifying your transaction. No funds were debited if the process cancelled.
        </p>

        {/* Reason Card */}
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl mb-8 text-left">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-450 block mb-1">Reason for Failure</span>
          <p className="text-xs text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed">
            {reason}
          </p>
        </div>

        {/* Retrying actions */}
        <div className="space-y-4">
          {courseId && (
            <Button
              onClick={() => navigate(`/payments/checkout?courseId=${courseId}`)}
              className="w-full flex items-center justify-center gap-1.5"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" /> Retry Checkout
            </Button>
          )}

          <Link to={ROUTES.courses} className="block">
            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" size="lg">
              <ArrowLeft className="h-4 w-4" /> Return to Catalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
