import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, Phone, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";
import { AuthCard } from "@/components/auth/shared/AuthCard";
import { AuthFooter } from "@/components/auth/shared/AuthHeader";
import { RoleSelector } from "@/components/auth/shared/RoleSelector";
import { StepProgressBar } from "@/components/auth/shared/StepProgressBar";
import { PasswordChecklist } from "@/components/auth/shared/PasswordChecklist";

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

const stepTitles: Record<number, { heading: string; sub: string }> = {
  1: { heading: "Who are you?", sub: "Choose your role to personalize your experience" },
  2: { heading: "Personal details", sub: "Tell us a bit about yourself" },
  3: { heading: "Secure your account", sub: "Create a strong password to protect your account" },
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
};

export default function Register() {
  const { register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema) as any,
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
  const roleNameVal = watch("roleName");

  const goNext = async (fields: (keyof RegisterFormInput)[]) => {
    const isValid = await trigger(fields);
    if (isValid) {
      setDirection(1);
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

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

  const currentStep = stepTitles[step];

  return (
    <AuthCard>
      {/* Step Progress */}
      <StepProgressBar
        currentStep={step}
        totalSteps={3}
        stepLabels={["Role", "Details", "Password"]}
      />

      {/* Step Header */}
      <motion.div
        className="text-center mt-8 mb-8"
        key={`header-${step}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl xl:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
          {currentStep.heading}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {currentStep.sub}
        </p>
      </motion.div>

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

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <input type="radio" {...register("roleName")} value={roleNameVal} className="sr-only" />
              <RoleSelector
                value={roleNameVal}
                onChange={(val) => setValue("roleName", val as "Student" | "Instructor" | "Mentor")}
                options={[
                  {
                    value: "Student",
                    label: "Student",
                    description: "Learn modern technology with expert-curated paths",
                    features: ["40+ Courses", "Projects", "Certificates", "Mentorship"],
                    accentColor: "blue",
                  },
                  {
                    value: "Instructor",
                    label: "Instructor",
                    description: "Design curriculum, mock setups, and learning modules",
                    features: ["Course Builder", "Analytics", "Revenue Share", "Students"],
                    accentColor: "purple",
                  },
                  {
                    value: "Mentor",
                    label: "Mentor",
                    description: "Verify capstones and guide developers to mastery",
                    features: ["Review Queue", "Guidance Tools", "Expert Network", "Recognition"],
                    accentColor: "emerald",
                  },
                ]}
              />
              <Button
                type="button"
                onClick={() => goNext(["roleName"])}
                className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Personal Info */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="reg-first" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    First name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      id="reg-first"
                      type="text"
                      {...register("firstName")}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                      placeholder="Alex"
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reg-last" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Last name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      id="reg-last"
                      type="text"
                      {...register("lastName")}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                      placeholder="Student"
                      autoComplete="family-name"
                      aria-invalid={!!errors.lastName}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Email address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    id="reg-email"
                    type="email"
                    {...register("email")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                    placeholder="alex@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-phone" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Phone number <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    id="reg-phone"
                    type="tel"
                    {...register("phone")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                    placeholder="+919876543210"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </span>
                </Button>
                <Button
                  type="button"
                  onClick={() => goNext(["firstName", "lastName", "email", "phone"])}
                  className="flex-1 py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Password */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
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
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Confirm password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 transition-all duration-200"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none transition-colors duration-200 p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 mt-1.5">
                    <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <PasswordChecklist password={passwordVal} />

              {/* Terms */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer group leading-relaxed">
                  <input
                    type="checkbox"
                    {...register("acceptTerms")}
                    className="h-4 w-4 mt-0.5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 transition accent-blue-600"
                  />
                  <span>
                    I accept the{" "}
                    <Link to={ROUTES.terms} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                      Terms and Conditions
                    </Link>{" "}
                    and the{" "}
                    <Link to={ROUTES.privacy} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-xs text-red-500 font-medium">{errors.acceptTerms.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={goBack}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </span>
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !watch("acceptTerms")}
                  className="flex-1 py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AuthFooter variant="simple">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            to={ROUTES.login}
            className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
          >
            Sign In
          </Link>
        </p>
      </AuthFooter>
    </AuthCard>
  );
}
