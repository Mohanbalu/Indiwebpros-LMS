import type { InvoiceData } from "@/types/payment.types";
import { forwardRef } from "react";

interface InvoicePrintViewProps {
  invoice: InvoiceData;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    SUCCESS: { label: "PAID", color: "#16a34a" },
    PENDING: { label: "PENDING", color: "#d97706" },
    FAILED: { label: "FAILED", color: "#dc2626" },
    REFUNDED: { label: "REFUNDED", color: "#7c3aed" },
  };
  return map[status] ?? { label: status, color: "#6b7280" };
}

export const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(
  ({ invoice }, ref) => {
    const badge = getStatusBadge(invoice.status);

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          maxWidth: "740px",
          margin: "0 auto",
          padding: "40px",
          backgroundColor: "#ffffff",
          color: "#18181b",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", borderBottom: "2px solid #3b82f6", paddingBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#1d4ed8", margin: 0, letterSpacing: "-0.5px" }}>
              IndiWebPros
            </h1>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0 0", fontWeight: 600 }}>
              LEARNING PLATFORM
            </p>
            <div style={{ marginTop: "12px", fontSize: "11px", color: "#6b7280", lineHeight: "1.8" }}>
              <p style={{ margin: 0 }}>{invoice.company.name}</p>
              <p style={{ margin: 0 }}>{invoice.company.address}</p>
              <p style={{ margin: 0 }}>{invoice.company.email}</p>
              <p style={{ margin: 0 }}>{invoice.company.website}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#18181b", letterSpacing: "-0.5px" }}>
              INVOICE
            </div>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
              <div>
                <strong style={{ color: "#18181b" }}>{invoice.invoiceNumber}</strong>
              </div>
              <div>Date: {formatDate(invoice.paidAt || invoice.createdAt)}</div>
            </div>
            <div style={{ marginTop: "12px", display: "inline-block", padding: "4px 14px", borderRadius: "999px", backgroundColor: badge.color, color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
              {badge.label}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 0" }}>
              Bill To
            </p>
            <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px 0" }}>
              {invoice.student.firstName} {invoice.student.lastName}
            </p>
            <p style={{ color: "#6b7280", margin: "0 0 2px 0" }}>{invoice.student.email}</p>
            {invoice.student.phone && (
              <p style={{ color: "#6b7280", margin: 0 }}>{invoice.student.phone}</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 0" }}>
              Payment Details
            </p>
            {invoice.transactionId && (
              <p style={{ margin: "0 0 4px 0", fontSize: "11px" }}>
                <strong>Order ID:</strong>{" "}
                <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#6b7280" }}>
                  {invoice.transactionId}
                </span>
              </p>
            )}
            {invoice.razorpayPaymentId && (
              <p style={{ margin: "0 0 4px 0", fontSize: "11px" }}>
                <strong>Payment ID:</strong>{" "}
                <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#6b7280" }}>
                  {invoice.razorpayPaymentId}
                </span>
              </p>
            )}
            {invoice.paymentMethod && (
              <p style={{ margin: "0 0 4px 0", fontSize: "11px" }}>
                <strong>Method:</strong> {invoice.paymentMethod}
              </p>
            )}
            <p style={{ margin: "0 0 4px 0", fontSize: "11px" }}>
              <strong>Date:</strong> {formatDate(invoice.paidAt || invoice.createdAt)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ backgroundColor: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
                DESCRIPTION
              </th>
              <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
                QTY
              </th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
              <td style={{ padding: "14px", fontSize: "13px" }}>
                <strong>{invoice.course.title}</strong>
                <br />
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Lifetime Access — Online Course</span>
              </td>
              <td style={{ padding: "14px", textAlign: "center" }}>1</td>
              <td style={{ padding: "14px", textAlign: "right" }}>₹{formatINR(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
          <div style={{ width: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e4e4e7" }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>₹{formatINR(invoice.amount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e4e4e7" }}>
                <span style={{ color: "#16a34a" }}>
                  Coupon{invoice.couponCode ? ` (${invoice.couponCode})` : ""}
                </span>
                <span style={{ color: "#16a34a" }}>-₹{formatINR(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e4e4e7" }}>
                <span style={{ color: "#6b7280" }}>GST (18%)</span>
                <span>₹{formatINR(invoice.tax)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", backgroundColor: "#f4f4f5", marginTop: "4px", borderRadius: "6px", paddingLeft: "8px", paddingRight: "8px" }}>
              <strong style={{ fontSize: "14px" }}>Total Paid</strong>
              <strong style={{ fontSize: "14px", color: "#1d4ed8" }}>₹{formatINR(invoice.finalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e4e4e7", paddingTop: "20px", textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
          <p style={{ margin: "0 0 4px 0" }}>
            Thank you for learning with IndiWebPros! 🚀
          </p>
          <p style={{ margin: 0 }}>
            For support, contact us at {invoice.company.email} | {invoice.company.website}
          </p>
        </div>
      </div>
    );
  }
);

InvoicePrintView.displayName = "InvoicePrintView";
