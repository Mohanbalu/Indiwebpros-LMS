import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  User,
  Award,
  LogOut,
  X,
  Users,
  ClipboardList,
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Home,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "../ui/Button";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/context/AuthContext";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isInstructor = user?.role === "Instructor";

  const menuItems = isInstructor
    ? [
        { label: "Dashboard", icon: LayoutDashboard, path: "/instructor?tab=dashboard" },
        { label: "Courses", icon: BookOpen, path: "/instructor?tab=courses" },
        { label: "Students", icon: Users, path: "/instructor?tab=students" },
        { label: "Assignments", icon: ClipboardList, path: "/instructor?tab=assignments" },
        { label: "Quizzes", icon: HelpCircle, path: "/instructor?tab=quizzes" },
        { label: "Certificates", icon: Award, path: "/instructor?tab=certificates" },
        { label: "Analytics", icon: TrendingUp, path: "/instructor?tab=analytics" },
        { label: "Student Catalog", icon: GraduationCap, path: ROUTES.courses || "/courses" },
        { label: "Public Home", icon: Home, path: ROUTES.home || "/" },
      ]
    : [
        { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
        { label: "My Courses", icon: BookOpen, path: ROUTES.courses },
        { label: "My Certificates", icon: Award, path: ROUTES.certificates },
        { label: "Profile", icon: User, path: ROUTES.profile },
      ];


  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-45 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isInstructor
              ? (location.pathname + location.search) === item.path || (location.pathname === "/instructor" && item.path === "/instructor?tab=dashboard" && !location.search)
              : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-bold tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10 dark:from-blue-600/90 dark:to-indigo-600/90 dark:text-zinc-50 dark:shadow-none"
                    : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 hover:text-zinc-950 dark:hover:text-zinc-100 hover:translate-x-0.5"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform ${isActive ? "scale-105" : "opacity-80"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
          <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400 font-bold truncate select-none">
            <span>Signed in: {user?.email}</span>
          </div>
          <Link to="/" className="block">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 rounded-xl border-zinc-250 hover:bg-rose-500/5 text-rose-500 hover:text-rose-600 dark:border-zinc-800 dark:hover:bg-rose-500/5 dark:text-rose-400 dark:hover:text-rose-300 font-bold transition-all py-2.5"
              onClick={async () => {
                await logout();
                onClose();
              }}
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
