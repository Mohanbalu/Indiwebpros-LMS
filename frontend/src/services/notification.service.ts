import { api } from "./api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    unreadCount: number;
    items: NotificationItem[];
  };
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const res = await api.get("/dashboard/student/notifications");
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get("/notifications/unread/count");
    return res.data.data?.count ?? 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
