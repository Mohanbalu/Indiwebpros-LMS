import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  className?: string;
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: StepProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        {/* Progress track background */}
        <div className="absolute top-1.5 left-3 right-3 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" />

        {/* Animated progress fill */}
        <div className="absolute top-1.5 left-3 right-3 h-1 overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ((currentStep - 1) / (totalSteps - 1)) }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
          />
        </div>

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <motion.div
              key={step}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: step * 0.1 }}
            >
              <motion.div
                className={cn(
                  "relative z-10 h-3 w-3 rounded-full border-2 transition-all duration-300",
                  step < currentStep
                    ? "bg-blue-500 border-blue-500"
                    : step === currentStep
                      ? "bg-white border-blue-500 ring-4 ring-blue-500/20"
                      : "bg-white border-zinc-200 dark:border-zinc-700"
                )}
                animate={{ scale: step === currentStep ? 1.3 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 17, delay: step * 0.1 }}
              >
                <AnimatePresence>
                  {step < currentStep && (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 17 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg className="h-1.5 w-1.5 text-white stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {stepLabels && stepLabels[step - 1] && (
                <motion.span
                  className={cn(
                    "mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap",
                    step <= currentStep
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: step * 0.1 + 0.2 }}
                >
                  {stepLabels[step - 1]}
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step info */}
      {stepLabels && stepLabels[currentStep - 1] && (
        <motion.p
          className="mt-4 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
        </motion.p>
      )}
    </motion.div>
  );
}
