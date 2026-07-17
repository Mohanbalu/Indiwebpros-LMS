import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/config/routes.config";

export default function Unauthorized() {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md text-center">
      <div className="flex flex-col items-center mb-6">
        <Logo />
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-4">Access Denied</h1>
      </div>

      <div className="py-6">
        <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
          <ShieldAlert className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Unauthorized Access (403)</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          You do not hold the required security role permissions to access this dashboard.
        </p>

        <div className="mt-8 space-y-3">
          <Link to="/" className="block">
            <Button className="w-full font-semibold">Go to Homepage</Button>
          </Link>
          <Link to={ROUTES.login} className="block">
            <Button variant="outline" className="w-full font-semibold">Sign In Again</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
