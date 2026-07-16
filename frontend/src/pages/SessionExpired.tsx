import { Link } from "react-router-dom";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

export default function SessionExpired() {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md text-center">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Session Expired</h1>
      </div>

      <div className="py-6">
        <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
          <ShieldAlert className="h-8 w-8 animate-bounce" />
        </div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Please Sign In Again</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          For your security, login sessions expire automatically after periods of inactivity or when cookies are cleared.
        </p>

        <Link to={ROUTES.login} className="block mt-8">
          <Button className="w-full font-semibold flex items-center justify-center gap-2">
            Sign In Again <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
