import { useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Download, BookOpen, Receipt, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { InvoicePrintView } from "@/components/payment/InvoicePrintView";
import { useInvoice } from "@/hooks/usePaymentHistory";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const courseName = searchParams.get("courseName") || "Your Course";
  const courseId = searchParams.get("courseId");
  const paymentId = searchParams.get("paymentId");
  const transactionId = searchParams.get("transactionId");
  const isFree = searchParams.get("isFree") === "true";

  // Fetch invoice data from backend if we have a paymentId
  const { data: invoiceRes, isLoading: invoiceLoading } = useInvoice(paymentId);
  const invoice = invoiceRes?.data;

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !invoice) return;
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { margin: 0; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-zinc-50 to-blue-50/30 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-blue-950/10 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Success Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl shadow-2xl shadow-emerald-100/60 dark:shadow-emerald-950/30 overflow-hidden">

          {/* Green banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{ width: 6, height: 6, left: `${10 + i * 12}%`, top: "50%" }}
                  animate={{ y: [0, -30, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-white">
              {isFree ? "Enrolled Successfully!" : "Payment Successful!"}
            </h1>
            <p className="text-emerald-100 text-sm mt-2 font-medium">
              {isFree
                ? "You now have free access to the course."
                : "Your payment has been processed. Happy learning! 🚀"}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Details */}
            <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Course</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-50 text-right max-w-[60%] line-clamp-2">{courseName}</span>
              </div>

              {invoice ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Invoice No.</span>
                    <code className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {invoice.invoiceNumber}
                    </code>
                  </div>
                  {invoice.finalAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Amount Paid</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ₹{formatINR(invoice.finalAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatDate(invoice.paidAt || invoice.createdAt)}
                    </span>
                  </div>
                  {invoice.paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Method</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase text-xs">
                        {invoice.paymentMethod}
                      </span>
                    </div>
                  )}
                </>
              ) : !isFree && transactionId ? (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Payment ID</span>
                  <code className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {transactionId.slice(0, 24)}
                  </code>
                </div>
              ) : null}

              {invoiceLoading && paymentId && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading invoice details...
                </div>
              )}
            </div>

            {/* Invoice Download */}
            {invoice && (
              <Button
                id="download-invoice-btn"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handlePrintInvoice}
              >
                <Receipt className="h-4 w-4" />
                Download Invoice
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                id="start-learning-btn"
                onClick={() => navigate(courseId ? `${ROUTES.player}?courseId=${courseId}` : ROUTES.player)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                <BookOpen className="h-5 w-5" />
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Link to="/student" className="block">
                <Button
                  id="view-my-courses-btn"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  View My Courses
                </Button>
              </Link>
            </div>

            {/* Payments link */}
            {!isFree && (
              <div className="text-center">
                <Link
                  to={ROUTES.myPayments}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  View all payment history →
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hidden invoice for printing */}
      {invoice && (
        <div className="hidden">
          <InvoicePrintView ref={printRef} invoice={invoice} />
        </div>
      )}
    </div>
  );
}
