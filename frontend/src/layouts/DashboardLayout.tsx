import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "@/components/common/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/hooks/useDashboard";
import { timeAgo } from "@/lib/time";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { data: dashboardData } = useDashboard();
  const notifications = dashboardData?.notifications;
  const unreadCount = notifications?.unreadCount || 0;
  const items = notifications?.items || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            {/* Bell Notification Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto w-auto relative cursor-pointer"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Toggle notifications"
              >
                <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-blue-600 text-[8px] font-black text-white flex items-center justify-center select-none animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-300 tracking-wider select-none">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full select-none">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850 custom-scrollbar">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 space-y-1.5 transition ${
                            !item.isRead
                              ? "bg-blue-500/5 dark:bg-blue-500/5 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                          <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 block">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        <p className="text-xs text-zinc-500 dark:text-zinc-650">
                          No notifications yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}
