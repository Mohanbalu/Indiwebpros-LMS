import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormInput) => {
    try {
      setLoading(true);
      setErrorMsg("");
      await forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to initiate password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Forgot Password</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
          Enter your registered email below, and we'll send you a password reset link.
        </p>
      </div>

      {success ? (
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Reset Link Sent</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Check your inbox for instructions to reset your password. If you don't receive it in a few minutes, check your spam folder.
          </p>
          <Link to={ROUTES.login}>
            <Button className="mt-6 w-full">Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex gap-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  {...register("email")}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to={ROUTES.login} className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-bold hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
