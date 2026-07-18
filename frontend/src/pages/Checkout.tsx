import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/context/AuthContext";
import { usePayment } from "@/hooks/usePayment";

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
  prefill: { name: string; email: string };
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
    if (rzp) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const courseId = searchParams.get("courseId");

  const {
    paymentState,
    setPaymentState,
    errorMsg,
    createOrder,
    verifyPayment,
  } = usePayment();

  // Query to fetch Course details
  const { data: courseRes, isLoading: courseLoading } = useQuery({
    queryKey: ["checkoutCourse", courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}`);
      return res.data;
    },
    enabled: !!courseId,
  });

  const course = courseRes?.success ? courseRes.data : null;

  useEffect(() => {
    if (!courseId) {
      navigate(ROUTES.courses);
    }
  }, [courseId, navigate]);

  const handlePayment = async () => {
    try {
      const orderRes = await createOrder({ courseId: courseId! });
      if (!orderRes.success || !orderRes.payment) {
        throw new Error("Failed to initialize payment record");
      }

      const { payment } = orderRes;

      setPaymentState("opening_razorpay");

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout SDK failed to load. Please check your connection.");
      }

      const Razorpay = (window as unknown as RazorpayWindow).Razorpay;
      if (!Razorpay) {
        throw new Error("Razorpay SDK not available");
      }

      const rzp = new Razorpay({
        key: "",
        amount: payment.finalAmount,
        currency: payment.currency || "INR",
        name: "IndiWebPros LMS",
        description: course?.title || "Course Access Payment",
        order_id: payment.id,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email || "",
        },
        theme: { color: "#3B82F6" },
        handler: async (response) => {
          await verifyPayment({
            paymentId: payment.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          navigate(
            `${ROUTES.paymentSuccess}?courseName=${encodeURIComponent(
              course?.title || ""
            )}&transactionId=${response.razorpay_payment_id}&courseId=${course?.id}`
          );
        },
        modal: {
          ondismiss: () => {},
        },
      });

      rzp.open();
    } catch (err) {
      navigate(
        `${ROUTES.paymentFailure}?error=${encodeURIComponent(
          err instanceof Error ? err.message : "Payment setup failed"
        )}`
      );
    }
  };

  const handleSimulatedMockSuccess = async () => {
    try {
      const orderRes = await api.post("/purchases", { courseId, provider: "MOCK" });
      if (!orderRes.data?.success || !orderRes.data?.payment) {
        throw new Error("Failed to initialize mock payment record");
      }

      const { payment } = orderRes.data;

      const verifyRes = await api.post("/payments/mock", {
        paymentId: payment.id,
        status: "SUCCESS",
        paymentMethod: "MOCK_CARD",
      });

      if (verifyRes.data?.success) {
        navigate(
          `${ROUTES.paymentSuccess}?courseName=${encodeURIComponent(
            course?.title || ""
          )}&transactionId=${verifyRes.data.data?.transactionId || "mock-tx-123"}&courseId=${course?.id}`
        );
      } else {
        throw new Error("Mock verification failed");
      }
    } catch (err) {
      navigate(
        `${ROUTES.paymentFailure}?error=${encodeURIComponent(
          err instanceof Error ? err.message : "Simulated payment failed"
        )}`
      );
    }
  };

  if (courseLoading || !course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mt-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Loading checkout gateway details...
        </span>
      </div>
    );
  }

  const basePrice = course.price;
  const finalPrice = course.price;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-6">
      <div className="mx-auto max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-8 shadow-sm">
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300 mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Return to catalog
        </Link>

        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-6">Checkout Summary</h1>

        {/* Course Line Item Info */}
        <div className="flex items-start gap-4 p-4 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl mb-8 bg-zinc-50/50 dark:bg-zinc-900/10">
          <div className="h-16 w-24 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs">
            Course Title
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
              {course.title}
            </h2>
            <p className="text-xs text-zinc-450 mt-1 line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        {/* Pricing break downs */}
        <div className="space-y-3 text-xs border-b border-zinc-200/50 dark:border-zinc-800/80 pb-6 mb-6">
          <div className="flex justify-between text-zinc-500">
            <span>Course Access Fee</span>
            <span className="font-semibold">₹{basePrice}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Tax (GST)</span>
            <span className="font-semibold">₹0.00</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Platform Discount</span>
            <span className="font-semibold text-green-600">-₹0.00</span>
          </div>
        </div>

        <div className="flex justify-between text-sm font-bold mb-8 text-zinc-900 dark:text-zinc-50">
          <span>Order Total</span>
          <span className="text-lg font-black">₹{finalPrice}</span>
        </div>

        {/* Error Display */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex gap-2 mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* State Indicators */}
        {paymentState !== "idle" && paymentState !== "payment_cancelled" && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>
              {paymentState === "creating_order" && "Creating order record on servers..."}
              {paymentState === "opening_razorpay" && "Loading secure checkout window..."}
              {paymentState === "payment_processing" && "Processing transaction details..."}
            </span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
            disabled={
              paymentState === "creating_order" ||
              paymentState === "opening_razorpay" ||
              paymentState === "payment_processing"
            }
          >
            <CreditCard className="h-5 w-5" /> Pay with Razorpay
          </Button>

          {/* simulated test success trigger for headless environments */}
          {process.env.NODE_ENV !== "production" && (
            <Button
              onClick={handleSimulatedMockSuccess}
              variant="outline"
              className="w-full simulate-rzp-payment-success-btn"
              size="lg"
              disabled={
                paymentState === "creating_order" ||
                paymentState === "opening_razorpay" ||
                paymentState === "payment_processing"
              }
            >
              Simulate Payment Success (E2E)
            </Button>
          )}

          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-4">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure 256-bit SSL encrypted connection
          </div>
        </div>
      </div>
    </div>
  );
}
