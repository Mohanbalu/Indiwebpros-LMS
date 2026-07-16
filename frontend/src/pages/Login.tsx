import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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

      // Role Detection & Redirect
      const role = userProfile.role;
      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Instructor") {
        navigate("/instructor");
      } else if (role === "Mentor") {
        navigate("/mentor");
      } else {
        navigate("/student");
      }
    } catch (err: any) {
      const responseMessage = err.response?.data?.message || err.message;
      if (responseMessage.includes("suspended") || responseMessage.includes("inactive")) {
        setErrorMsg("Your account has been suspended or deactivated. Please contact support.");
      } else if (responseMessage.includes("verify") || responseMessage.includes("verification")) {
        // Redirect to email sent / verify page
        navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setErrorMsg("Invalid credentials or email. Please check your login details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
      <div className="flex flex-col items-center mb-8">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Sign In to LMS</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Welcome back! Enter your login credentials below.
        </p>
      </div>

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
              id="email-input"
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

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Password</label>
            <Link to={ROUTES.forgotPassword} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              id="password-input"
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
          {errors.password && (
            <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
            <input type="checkbox" {...register("rememberMe")} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <Button id="login-submit-btn" type="submit" disabled={loading} className="w-full font-semibold">
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Social login buttons */}
      <div className="mt-6 border-t border-zinc-150 dark:border-zinc-800/80 pt-6">
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-3">Or continue with</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" type="button" className="w-full text-xs font-semibold py-2">
            Google
          </Button>
          <Button variant="outline" type="button" className="w-full text-xs font-semibold py-2">
            Microsoft
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        Don't have an account?{" "}
        <Link to={ROUTES.register} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
