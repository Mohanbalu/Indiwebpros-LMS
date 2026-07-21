import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Download, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/config/routes.config";
import type { PaymentRecord, PaymentStatus } from "@/types/payment.types";

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDownloadInvoice: (paymentId: string) => void;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  SUCCESS: { label: "Paid", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  INITIATED: { label: "Initiated", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  FAILED: { label: "Failed", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" },
  REFUNDED: { label: "Refunded", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400" },
  PARTIAL_REFUND: { label: "Partial Refund", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" },
};

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Skeleton row
function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function PaymentHistoryTable({
  payments,
  total,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onDownloadInvoice,
}: PaymentHistoryTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.course.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course or transaction ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
            className="pl-9 pr-8 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none cursor-pointer transition-all"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/60 dark:border-zinc-700/60">
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                        💳
                      </div>
                      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        {search || statusFilter ? "No matching payments found" : "No payment history yet"}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {!search && !statusFilter && "Enroll in a course to see your payments here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((payment, idx) => {
                    const statusCfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING;
                    const coupon = payment.couponUsages?.[0]?.coupon;
                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.03 }}
                        className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Course */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {payment.course.thumbnail?.url ? (
                              <img
                                src={payment.course.thumbnail.url}
                                alt={payment.course.title}
                                className="h-9 w-14 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                                LMS
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[160px]">
                                {payment.course.title}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {payment.course.instructor.firstName} {payment.course.instructor.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div>
                            {payment.transactionId ? (
                              <code className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                {payment.transactionId.slice(0, 20)}…
                              </code>
                            ) : (
                              <span className="text-zinc-400 text-xs">—</span>
                            )}
                            {coupon && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                                🏷 {coupon.code}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50">
                              ₹{formatINR(payment.finalAmount)}
                            </span>
                            {payment.discount > 0 && (
                              <p className="text-[10px] text-zinc-400 line-through">
                                ₹{formatINR(payment.amount)}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {payment.status === "SUCCESS" && (
                              <>
                                <button
                                  onClick={() => onDownloadInvoice(payment.id)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                  title="Download Invoice"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => navigate(`${ROUTES.player}?courseId=${payment.courseId}`)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                  title="Go to Course"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200/60 dark:border-zinc-700/60">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {total} total payment{total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
