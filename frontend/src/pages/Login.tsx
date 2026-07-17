import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/types/api.types";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { AuthCard } from "@/components/auth/shared/AuthCard";
import { AuthHeader, AuthFooter, SocialLoginSection } from "@/components/auth/shared/AuthHeader";
import { DividerWithText } from "@/components/auth/shared/AuthCard";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormInput) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const userProfile = await login(data.email, data.password);

      const role = userProfile.role;
      const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
      const redirectParam = new URLSearchParams(location.search).get("redirect");

      const roleDefault =
        role === "Admin" ? "/admin" :
        role === "Instructor" ? "/instructor" :
        role === "Mentor" ? "/mentor" :
        "/student";

      const redirectTo = `${from?.pathname || ""}${from?.search || ""}`;
      if (redirectTo && !redirectTo.includes("/auth/")) {
        navigate(redirectTo, { replace: true });
      } else if (redirectParam && !redirectParam.includes("/auth/")) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(roleDefault, { replace: true });
      }
    } catch (err) {
      const responseMessage = extractErrorMessage(err, "");
      if (responseMessage.includes("suspended") || responseMessage.includes("inactive")) {
        setErrorMsg("Your account has been suspended or deactivated. Please contact support.");
      } else if (responseMessage.includes("verify") || responseMessage.includes("verification")) {
        navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setErrorMsg("Invalid credentials or email. Please check your login details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to your account to continue learning"
      />

      {errorMsg && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm font-semibold flex gap-3 items-center"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          role="alert"
        >
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email-input" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              id="email-input"
              type="email"
              {...register("email")}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1.5">
              <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password-input" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full pl-11 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none transition-colors duration-200 p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1.5">
              <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center">
          <label className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer group">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
            />
            <span className="group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors duration-200">
              Remember me for 30 days
            </span>
          </label>
        </div>

        {/* Submit */}
        <Button
          id="login-submit-btn"
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
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <DividerWithText />

      <SocialLoginSection disabled={loading} />

      <AuthFooter variant="simple">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.register}
            className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
          >
            Create one
            <ArrowRight className="inline h-3.5 w-3.5 ml-0.5" />
          </Link>
        </p>
      </AuthFooter>
    </AuthCard>
  );
}
