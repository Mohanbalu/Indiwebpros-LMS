import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, TrendingDown, CheckCircle2, Clock,
  AlertCircle, Receipt,
} from "lucide-react";
import { usePaymentHistory, useInvoice } from "@/hooks/usePaymentHistory";
import { PaymentHistoryTable } from "@/components/payment/PaymentHistoryTable";
import { InvoicePrintView } from "@/components/payment/InvoicePrintView";
import type { InvoiceData } from "@/types/payment.types";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 relative overflow-hidden"
    >
      <div className={`absolute inset-0 opacity-[0.04] dark:opacity-[0.07] ${gradient}`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white ${gradient}`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{value}</p>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function MyPayments() {
  const [page, setPage] = useState(1);
  const [invoicePaymentId, setInvoicePaymentId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = usePaymentHistory(page, 20);
  const { data: invoiceRes } = useInvoice(invoicePaymentId);

  const payments = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Compute stats from loaded data
  const successPayments = payments.filter((p) => p.status === "SUCCESS");
  const totalSpent = successPayments.reduce((sum, p) => sum + p.finalAmount, 0);
  const totalSaved = successPayments.reduce((sum, p) => sum + p.discount, 0);
  const pendingCount = payments.filter((p) => p.status === "PENDING" || p.status === "INITIATED").length;

  const handleDownloadInvoice = (paymentId: string) => {
    setInvoicePaymentId(paymentId);
  };

  // Watch for invoice data and trigger print
  const handlePrint = (invoice: InvoiceData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
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
            @media print { @page { size: A4; margin: 20mm; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    setInvoicePaymentId(null);
  };

  // Trigger print when invoice loads
  if (invoiceRes?.data && invoicePaymentId) {
    // Defer to avoid React render cycle
    setTimeout(() => handlePrint(invoiceRes.data), 100);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <CreditCard className="h-4.5 w-4.5 text-white" style={{ height: "18px", width: "18px" }} />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Payment History</h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-12">
              All your course purchases and transactions
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        {!isLoading && payments.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CreditCard className="h-5 w-5" />}
              label="Total Spent"
              value={`₹${formatINR(totalSpent)}`}
              sub={`${successPayments.length} successful payment${successPayments.length !== 1 ? "s" : ""}`}
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              delay={0.05}
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5" />}
              label="Total Saved"
              value={`₹${formatINR(totalSaved)}`}
              sub={totalSaved > 0 ? "via coupons & discounts" : "No discounts yet"}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              delay={0.1}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Courses Purchased"
              value={String(successPayments.length)}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              delay={0.15}
            />
            <StatCard
              icon={pendingCount > 0 ? <Clock className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
              label={pendingCount > 0 ? "Pending" : "All Payments"}
              value={pendingCount > 0 ? String(pendingCount) : String(total)}
              sub={pendingCount > 0 ? "awaiting confirmation" : "total records"}
              gradient={pendingCount > 0 ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-zinc-500 to-zinc-700"}
              delay={0.2}
            />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-4"
          >
            <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Failed to load payment history</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-500/80 mt-0.5">
                Please refresh the page or try again later.
              </p>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <PaymentHistoryTable
            payments={payments}
            total={total}
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
            onDownloadInvoice={handleDownloadInvoice}
          />
        </motion.div>
      </div>

      {/* Hidden invoice print zone */}
      {invoiceRes?.data && (
        <div className="hidden">
          <InvoicePrintView ref={printRef} invoice={invoiceRes.data} />
        </div>
      )}
    </div>
  );
}
