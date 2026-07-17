import { memo } from "react";
import { Link } from "react-router-dom";
import { Play, BookOpen, Award, User, MessageCircle } from "lucide-react";
import { ROUTES } from "@/config/routes.config";

interface QuickActionItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const actions: QuickActionItem[] = [
  { label: "Learn", icon: <Play className="h-3.5 w-3.5 fill-current/10" />, href: ROUTES.player, color: "bg-blue-50/60 hover:bg-blue-100/80 text-blue-600 border border-blue-100 hover:border-blue-200 dark:bg-blue-950/25 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30" },
  { label: "Catalog", icon: <BookOpen className="h-3.5 w-3.5" />, href: ROUTES.courses, color: "bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-600 border border-emerald-100 hover:border-emerald-200 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30" },
  { label: "Credentials", icon: <Award className="h-3.5 w-3.5" />, href: ROUTES.certificates, color: "bg-amber-50/60 hover:bg-amber-100/80 text-amber-600 border border-amber-100 hover:border-amber-200 dark:bg-amber-950/25 dark:hover:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30" },
  { label: "Profile", icon: <User className="h-3.5 w-3.5" />, href: ROUTES.profile, color: "bg-purple-50/60 hover:bg-purple-100/80 text-purple-600 border border-purple-100 hover:border-purple-200 dark:bg-purple-950/25 dark:hover:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30" },
];

export const QuickActionBar = memo(function QuickActionBar() {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-102 hover:-translate-y-0.25 ${action.color}`}
        >
          {action.icon}
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
});
