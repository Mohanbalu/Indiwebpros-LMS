import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CreditCard, ShieldCheck, AlertCircle, Loader2,
  BookOpen, Clock, Globe, Award, CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/context/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { CouponInput } from "@/components/payment/CouponInput";
import { OrderSummaryCard, computeFinalAmount } from "@/components/payment/OrderSummaryCard";

interface RazorpayInstance {
  open(): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  handler(response: Record<string, string>): void;
  modal: { ondismiss(): void };
}

interface RazorpayWindow {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const rzp = (window as unknown as RazorpayWindow).Razorpay;
    if (rzp) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/20 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 py-12 px-6">
      <div className="mx-auto max-w-xl space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
        <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl" />
        <div className="h-64 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl" />
      </div>
    </div>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const courseId = searchParams.get("courseId");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

  const {
    paymentState,
    setPaymentState,
    errorMsg,
    setErrorMsg,
    createOrder,
    verifyPayment,
    enrollFree,
    validateCoupon,
    isValidatingCoupon,
    couponData,
    couponError,
    removeCoupon,
  } = usePayment();

  // Fetch course details
  const { data: courseRes, isLoading: courseLoading, isError: courseError } = useQuery({
    queryKey: ["checkoutCourse", courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}`);
      return res.data;
    },
    enabled: !!courseId,
  });

  const course = courseRes?.success ? courseRes.data : null;

  useEffect(() => {
    if (!courseId) navigate(ROUTES.courses);
  }, [courseId, navigate]);

  const basePrice = course?.price ?? 0;
  const isFree = basePrice === 0;
  const finalAmount = computeFinalAmount(basePrice, couponData);

  const handleFreeEnrollment = async () => {
    try {
      await enrollFree({ courseId: courseId!, couponCode: couponData?.code });
      navigate(`${ROUTES.paymentSuccess}?courseName=${encodeURIComponent(course?.title || "")}&courseId=${course?.id}&isFree=true`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Enrollment failed");
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      setErrorMsg("Please agree to the Terms & Conditions to proceed.");
      return;
    }
    try {
      const orderRes = await createOrder({ courseId: courseId!, couponCode: couponData?.code });
      if (!orderRes.success || !orderRes.payment) {
        throw new Error("Failed to initialize payment record");
      }
      const { payment } = orderRes;

      setPaymentState("opening_razorpay");
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Razorpay SDK failed to load. Please check your internet connection.");

      const Razorpay = (window as unknown as RazorpayWindow).Razorpay;
      if (!Razorpay) throw new Error("Razorpay SDK not available");

      // Prefer transactionId (order_xxx), fall back to metadata. Never use payment.id (UUID).
      const razorpayOrderId = payment.transactionId ?? (payment.metadata as any)?.razorpayOrderId;
      if (!razorpayOrderId) {
        throw new Error("Razorpay Order ID missing from backend response.");
      }

      console.log("Payment Object:", payment);
      console.log("Transaction ID:", payment.transactionId);
      console.log("Metadata:", payment.metadata);
      console.log("Order ID sent to Razorpay:", razorpayOrderId);

      const rzp = new Razorpay({
        key: razorpayKeyId,
        amount: Math.round(finalAmount * 100), // paise
        currency: payment.currency || "INR",
        name: "IndiWebPros LMS",
        description: course?.title || "Course Access Payment",
        order_id: razorpayOrderId,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email || "",
        },
        theme: { color: "#3B82F6" },
        handler: async (response) => {
          try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
              throw new Error("Invalid Razorpay payment response.");
            }
            await verifyPayment({
              paymentId: payment.id,
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            });
            navigate(
              `${ROUTES.paymentSuccess}?courseName=${encodeURIComponent(course?.title || "")}&courseId=${course?.id}&paymentId=${payment.id}&transactionId=${razorpay_payment_id}`
            );
          } catch (err) {
            navigate(
              `${ROUTES.paymentFailure}?reason=${encodeURIComponent(err instanceof Error ? err.message : "Payment verification failed")}&courseId=${courseId}`
            );
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentState("payment_cancelled");
          },
        },
      });

      rzp.open();
    } catch (err) {
      navigate(
        `${ROUTES.paymentFailure}?reason=${encodeURIComponent(err instanceof Error ? err.message : "Payment setup failed")}&courseId=${courseId}`
      );
    }
  };

  if (courseLoading) return <CheckoutSkeleton />;

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Course not found</h2>
          <p className="text-sm text-zinc-500">We couldn't load the course details. Please try again.</p>
          <Link to={ROUTES.courses}>
            <Button className="w-full mt-2">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing =
    paymentState === "creating_order" ||
    paymentState === "opening_razorpay" ||
    paymentState === "payment_processing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-zinc-50 dark:from-zinc-950 dark:via-blue-950/10 dark:to-zinc-950 py-12 px-6">
      <div className="mx-auto max-w-xl">

        {/* Back */}
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl shadow-xl shadow-zinc-100/80 dark:shadow-zinc-950/60 overflow-hidden"
        >
          {/* Course Banner */}
          <div className="relative">
            {course.thumbnail?.url ? (
              <img
                src={course.thumbnail.url}
                alt={course.title}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-white/60" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h1 className="text-lg font-black text-white leading-tight line-clamp-2">{course.title}</h1>
              {course.instructor && (
                <p className="text-xs text-white/75 mt-1 font-medium">
                  by {course.instructor.firstName} {course.instructor.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Course Meta badges */}
          <div className="flex items-center gap-4 px-6 py-3 bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800/60 overflow-x-auto">
            {course.durationMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                {Math.round(course.durationMinutes / 60)}h content
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              {course.language || "English"}
            </div>
            {course.certificateEnabled && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                <Award className="h-3.5 w-3.5 text-yellow-500" />
                Certificate
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">

            {/* Coupon */}
            {!isFree && (
              <CouponInput
                courseId={courseId!}
                onValidate={validateCoupon}
                onRemove={removeCoupon}
                couponData={couponData}
                couponError={couponError}
                isLoading={isValidatingCoupon}
              />
            )}

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100/80 dark:border-zinc-700/50">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                Order Summary
              </h3>
              {isFree ? (
                <div className="text-center py-2">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                  <p className="text-xs text-zinc-500 mt-1">This course is available at no cost</p>
                </div>
              ) : (
                <OrderSummaryCard
                  basePrice={basePrice}
                  couponData={couponData}
                  gstRate={0}
                  currency={course.currency || "INR"}
                />
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Indicator */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold"
                >
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span>
                    {paymentState === "creating_order" && "Creating secure order on servers..."}
                    {paymentState === "opening_razorpay" && "Loading secure Razorpay checkout..."}
                    {paymentState === "payment_processing" && "Verifying your payment..."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            {!isFree && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (e.target.checked && errorMsg.includes("Terms")) setErrorMsg("");
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`h-4.5 w-4.5 rounded-[5px] border-2 flex items-center justify-center transition-all duration-200 ${
                      agreedToTerms
                        ? "bg-blue-600 border-blue-600"
                        : "border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400"
                    }`}
                    style={{ height: "18px", width: "18px" }}
                  >
                    {agreedToTerms && <CheckSquare className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  I agree to the{" "}
                  <Link to={ROUTES.terms} className="text-blue-600 dark:text-blue-400 underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to={ROUTES.refund} className="text-blue-600 dark:text-blue-400 underline" target="_blank">
                    Refund Policy
                  </Link>
                </span>
              </label>
            )}

            {/* CTA Buttons */}
            {isFree ? (
              <Button
                id="enroll-free-btn"
                onClick={handleFreeEnrollment}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Enrolling...</>
                ) : (
                  <><BookOpen className="h-5 w-5" /> Enroll for Free</>
                )}
              </Button>
            ) : (
              <Button
                id="pay-with-razorpay-btn"
                onClick={handlePayment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="h-5 w-5" /> Pay ₹{finalAmount.toFixed(2)} with Razorpay</>
                )}
              </Button>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              256-bit SSL encrypted · Secured by Razorpay
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
