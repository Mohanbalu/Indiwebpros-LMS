import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseName = searchParams.get("courseName") || "LMS Training Pathway";
  const transactionId = searchParams.get("transactionId") || "TXN_MOCK_VERIFIED_123456";
  const courseId = searchParams.get("courseId");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-8 text-center shadow-sm">
        {/* Animated Check Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Payment Successful!</h1>
        <p className="text-xs text-zinc-450 dark:text-zinc-450 mb-6">
          Your access has been successfully granted and processed. Welcome to the learning pathway!
        </p>

        {/* Transaction Card */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl mb-8 text-left space-y-2.5">
          <div className="text-xs text-zinc-500">
            <span className="font-semibold block mb-1">Enrolled Pathway</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">{courseName}</span>
          </div>
          <div className="text-xs text-zinc-500">
            <span className="font-semibold block mb-1">Transaction Ref</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-50">{transactionId}</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate(courseId ? `${ROUTES.player}?courseId=${courseId}` : ROUTES.player)}
            className="w-full start-learning-btn flex items-center justify-center gap-1.5"
            size="lg"
          >
            Start Learning <ArrowRight className="h-4 w-4" />
          </Button>

          <Link to="/student" className="block">
            <Button variant="outline" className="w-full" size="lg">
              View My Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
