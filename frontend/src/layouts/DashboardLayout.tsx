import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "@/components/common/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="p-2 h-auto w-auto relative">
              <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
