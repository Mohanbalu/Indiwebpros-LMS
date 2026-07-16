import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "@/config/app.config";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 select-none group">
      <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-110" />
      <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
        {APP_CONFIG.shortName}
      </span>
    </Link>
  );
}
