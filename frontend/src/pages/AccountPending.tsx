import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

export default function AccountPending() {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md text-center">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Account Pending</h1>
      </div>

      <div className="py-6">
        <div className="h-16 w-16 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-6">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Review In Progress</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          Your profile application is currently being evaluated by our system administrators. This process ensures all mentors and instructors hold verified credentials.
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
          You will receive a notification email once the approval process is complete (typically takes 24-48 hours).
        </p>

        <Link to="/" className="block mt-8">
          <Button className="w-full font-semibold">Back to Home</Button>
        </Link>
      </div>

      <div className="mt-6 border-t border-zinc-150 dark:border-zinc-850 pt-4 text-center">
        <Link to={ROUTES.login} className="text-xs text-zinc-500 dark:text-zinc-400 font-bold hover:underline">
          Sign In as another user
        </Link>
      </div>
    </div>
  );
}
