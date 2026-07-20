import { memo, useState } from "react";
import { Bell, CheckCheck, Mail, MailOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { timeAgo } from "@/lib/time";
import type { DashboardNotifications, DashboardNotification } from "@/types/dashboard.types";

interface NotificationDrawerProps {
  data: DashboardNotifications | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isMarkingRead: boolean;
  isMarkingAllRead: boolean;
}

export const NotificationDrawer = memo(function NotificationDrawer({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  onMarkRead,
  onMarkAllRead,
  isMarkingRead,
  isMarkingAllRead,
}: NotificationDrawerProps) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <Skeleton className="h-5 w-28 bg-zinc-150 dark:bg-zinc-800" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-zinc-150 dark:bg-zinc-800" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32 bg-zinc-200 dark:bg-zinc-900" />
                <Skeleton className="h-3 w-40 bg-zinc-200 dark:bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Notifications</h3>
        <div className="mt-3">
          <ErrorState
            title="Failed to load"
            message={error?.message || "Unable to fetch notifications."}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const displayItems = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <Bell className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center h-5 px-2 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="text-xs h-7 px-2.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/80 rounded-xl"
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="px-6 pb-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500">
            <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">All caught up!</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">No new notifications at this time.</p>
          </div>
        ) : (
          <div className="mt-3">
            <div className="space-y-3" role="list">
              {displayItems.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                  isMarkingRead={isMarkingRead}
                />
              ))}
            </div>
            {notifications.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-4 flex w-full items-center justify-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                {showAll ? (
                  <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Show All ({notifications.length}) <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface NotificationItemProps {
  notification: DashboardNotification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}

const NotificationItem = memo(function NotificationItem({ notification, onMarkRead, isMarkingRead }: NotificationItemProps) {
  return (
    <div
      className={`group relative flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-200 ${
        notification.isRead
          ? "bg-transparent border-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
          : "bg-blue-50/30 border-blue-100/50 dark:bg-blue-950/10 dark:border-blue-900/10 hover:border-blue-100 dark:hover:border-blue-900/30"
      }`}
      role="listitem"
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
          notification.isRead
            ? "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800"
            : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30"
        }`}
      >
        {notification.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs leading-normal truncate ${notification.isRead ? "text-zinc-400 dark:text-zinc-550" : "font-bold text-zinc-800 dark:text-zinc-200"}`}>
            {notification.title}
          </p>
          <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      {!notification.isRead && (
        <button
          onClick={() => onMarkRead(notification.id)}
          disabled={isMarkingRead}
          className="absolute right-3 top-3 h-5 w-5 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-250 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          aria-label={`Mark "${notification.title}" as read`}
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});
