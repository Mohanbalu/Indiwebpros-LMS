import { api } from "./api";

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  college?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  website?: string;
  coverUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  language?: string;
  gender?: string;
  dateOfBirth?: string;
  goals?: Array<{ id: string; title: string; category: string; completed: boolean }>;
  notificationPreferences?: Record<string, boolean>;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const profileService = {
  getProfileData: async (): Promise<any> => {
    const res = await api.get("/profile");
    return res.data.data;
  },

  updateProfileSettings: async (settings: ProfileUpdateInput): Promise<any> => {
    const res = await api.put("/profile", settings);
    return res.data;
  },

  uploadAvatar: async (
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<{ avatarUrl: string; fileId: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.post("/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
    return res.data.data;
  },

  uploadCover: async (
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<{ coverUrl: string; fileId: string }> => {
    const formData = new FormData();
    formData.append("cover", file);

    const res = await api.post("/profile/cover", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
    return res.data.data;
  },

  toggleWishlist: async (courseId: string): Promise<any> => {
    const res = await api.post("/profile/wishlist", { courseId });
    return res.data;
  },

  changePassword: async (data: ChangePasswordInput): Promise<any> => {
    const payload = {
      oldPassword: data.currentPassword || data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword,
    };
    const res = await api.post("/auth/change-password", payload);
    return res.data;
  },

  getSessions: async (): Promise<any> => {
    const res = await api.get("/auth/sessions");
    return res.data.data;
  },

  revokeSession: async (sessionId: string): Promise<any> => {
    const res = await api.post(`/auth/sessions/${sessionId}/revoke`);
    return res.data;
  },
};
