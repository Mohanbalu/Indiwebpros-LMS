import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, CheckCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordVal = watch("password") || "";

  // Live password strength calculation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Too Weak",
    color: "bg-red-500",
  });

  useEffect(() => {
    let score = 0;
    if (passwordVal.length >= 8) score += 1;
    if (/[a-z]/.test(passwordVal)) score += 1;
    if (/[A-Z]/.test(passwordVal)) score += 1;
    if (/[0-9]/.test(passwordVal)) score += 1;
    if (/[^a-zA-Z0-9]/.test(passwordVal)) score += 1;

    let label = "Too Weak";
    let color = "bg-red-500";

    if (score === 5) {
      label = "Strong Choice!";
      color = "bg-emerald-500";
    } else if (score >= 3) {
      label = "Good";
      color = "bg-yellow-500";
    }

    setPasswordStrength({ score, label, color });
  }, [passwordVal]);

  const onSubmit = async (data: ResetPasswordFormInput) => {
    if (!token) {
      setErrorMsg("Reset token is missing from the URL. Please request a new link.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update password. Link may be expired.");
      setValue("password", "");
      setValue("confirmPassword", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Reset Password</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Enter and confirm your new secure account password.
        </p>
      </div>

      {success ? (
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Password Updated</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Your account password has been successfully updated. You can now sign in using your new credentials.
          </p>
          <Link to={ROUTES.login}>
            <Button className="mt-6 w-full">Sign In</Button>
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

          {!token && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex gap-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>Warning: No reset token detected in URL parameter. Link is invalid.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Live strength meter */}
              {passwordVal.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    <span>Password Strength</span>
                    <span className={passwordStrength.score >= 3 ? "text-emerald-500" : "text-red-500"}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading || !token} className="w-full font-semibold">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
