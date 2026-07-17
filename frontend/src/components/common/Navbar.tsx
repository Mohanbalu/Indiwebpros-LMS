import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/config/routes.config";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Home", path: ROUTES.home },
    { label: "Courses", path: ROUTES.courses },
    { label: "Pricing", path: ROUTES.pricing },
    { label: "About", path: ROUTES.about },
    { label: "FAQ", path: ROUTES.faq },
    { label: "Contact", path: ROUTES.contact },
  ];

  const dashboardPath = user
    ? user.role === "Admin" ? "/admin" :
      user.role === "Instructor" ? "/instructor" :
      user.role === "Mentor" ? "/mentor" :
      "/student"
    : "/dashboard";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === "/courses" && location.pathname.startsWith("/courses/"));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-semibold transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-500 font-bold"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 focus:outline-none cursor-pointer"
                >
                  <Avatar
                    src={user.avatarFile?.url || undefined}
                    fallback={`${user.firstName} ${user.lastName}`}
                    size="sm"
                    className="hover:ring-2 hover:ring-blue-500/20 transition-all"
                  />
                </button>

                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-1.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-zinc-550 dark:text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to={dashboardPath}
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        Profile Settings
                      </Link>
                      <hr className="my-1 border-zinc-100 dark:border-zinc-800/80" />
                      <button
                        onClick={async () => {
                          setShowDropdown(false);
                          await logout();
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to={ROUTES.login}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to={ROUTES.register}>
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Nav Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-zinc-600 dark:text-zinc-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-4 space-y-3 flex flex-col animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/courses" && location.pathname.startsWith("/courses/"));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`text-base font-semibold py-2 border-b border-zinc-100 dark:border-zinc-900 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-500 font-bold"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {user ? (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
                <Avatar
                  src={user.avatarFile?.url || undefined}
                  fallback={`${user.firstName} ${user.lastName}`}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Link to={dashboardPath} onClick={() => setIsOpen(false)}>
                <Button className="w-full text-xs font-bold justify-start" variant="ghost">
                  Dashboard
                </Button>
              </Link>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button className="w-full text-xs font-bold justify-start" variant="ghost">
                  Profile Settings
                </Button>
              </Link>
              <Button
                className="w-full text-xs font-bold text-rose-500 justify-start"
                variant="ghost"
                onClick={async () => {
                  setIsOpen(false);
                  await logout();
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 pt-2">
              <Link to={ROUTES.login} className="flex-1" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to={ROUTES.register} className="flex-1" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
