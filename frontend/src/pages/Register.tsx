import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, Phone, Check, ShieldAlert } from "lucide-react";
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

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters long"),
    lastName: z.string().min(2, "Last name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (e.g. +919876543210)")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
    roleName: z.enum(["Student", "Instructor", "Mentor"]).default("Student"),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms of service"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormInput = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      roleName: "Student",
      acceptTerms: false,
    },
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

  const onSubmit = async (data: RegisterFormInput) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        confirmPassword: data.confirmPassword,
        roleName: data.roleName,
      };

      await registerApi(payload);
      // Redirect on success to verify-email sent template
      navigate(`/auth/email-sent?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const responseMessage = err.response?.data?.message || err.message;
      if (responseMessage.includes("exists") || responseMessage.includes("registered")) {
        setErrorMsg("Email address is already registered. Try signing in.");
      } else {
        setErrorMsg(responseMessage || "Failed to create account. Please check your credentials.");
      }
      setValue("password", "");
      setValue("confirmPassword", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Create Account</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Join our learning platform and master real-world coding skills.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                {...register("firstName")}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                placeholder="John"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-rose-500">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                {...register("lastName")}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                placeholder="Doe"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-rose-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="email"
              {...register("email")}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
              placeholder="john.doe@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Phone Number (Optional)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              {...register("phone")}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
              placeholder="+919876543210"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
              placeholder="Min 8 characters, upper/lower/digit/special"
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
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
              placeholder="Confirm password"
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

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Select Role</label>
          <select
            {...register("roleName")}
            className="w-full py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
          >
            <option value="Student">Student</option>
            <option value="Instructor">Instructor</option>
            <option value="Mentor">Mentor</option>
          </select>
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-xs text-zinc-550 dark:text-zinc-400 font-medium cursor-pointer">
            <input type="checkbox" {...register("acceptTerms")} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 mt-0.5" />
            <span>I accept the Terms and Conditions and agree to the Privacy Policy.</span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-rose-500">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full font-semibold">
          {loading ? "Registering..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        Already have an account?{" "}
        <Link to={ROUTES.login} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
