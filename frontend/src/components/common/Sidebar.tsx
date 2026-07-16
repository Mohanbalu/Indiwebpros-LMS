import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "../ui/Button";
import { ROUTES } from "@/config/routes.config";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.dashboard },
    { label: "My Courses", icon: BookOpen, path: ROUTES.courses },
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
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Signed in as user</span>
          </div>
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
