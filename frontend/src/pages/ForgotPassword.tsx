import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, ShieldAlert, KeyRound, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/types/api.types";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { AuthCard } from "@/components/auth/shared/AuthCard";
import { AuthHeader } from "@/components/auth/shared/AuthHeader";

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
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Failed to initiate password reset. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {success ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
          >
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
            We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          <Link to={ROUTES.login} className="block mt-8">
            <Button className="w-full py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
              <span className="flex items-center justify-center gap-2">
                Back to Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </motion.div>
      ) : (
        <>
          <AuthHeader
            showLogo={false}
            illustration={
              <motion.div
                className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 17, delay: 0.2 }}
              >
                <KeyRound className="h-8 w-8 text-white" />
              </motion.div>
            }
            title="Forgot password?"
            subtitle="Enter your email and we'll send you a reset link"
          />

          {errorMsg && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm font-semibold flex gap-3 items-center"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              role="alert"
            >
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="fp-email" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  id="fp-email"
                  type="email"
                  {...register("email")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "fp-email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="fp-email-error" className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1.5">
                  <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending reset link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to={ROUTES.login}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 font-semibold hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </AuthCard>
  );
}
