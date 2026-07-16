import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/Button";
import { ROUTES } from "@/config/routes.config";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Home", path: ROUTES.home },
    { label: "Courses", path: ROUTES.courses },
    { label: "Pricing", path: ROUTES.pricing },
    { label: "About", path: ROUTES.about },
    { label: "FAQ", path: ROUTES.faq },
    { label: "Contact", path: ROUTES.contact },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                  location.pathname === item.path
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <ThemeToggle />
            <Link to={ROUTES.login}>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to={ROUTES.register}>
              <Button size="sm">Get Started</Button>
            </Link>
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
        <div className="md:hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-4 space-y-3 flex flex-col">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`text-base font-medium py-2 border-b border-zinc-100 dark:border-zinc-900 ${
                location.pathname === item.path
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-4 pt-2">
            <Link to={ROUTES.login} className="flex-1" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link to={ROUTES.register} className="flex-1" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
