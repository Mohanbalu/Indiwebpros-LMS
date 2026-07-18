import { api } from "./api";

export const profileService = {
  getProfileData: async (): Promise<any> => {
    const res = await api.get("/dashboard/student/profile");
    return res.data.data;
  },

  updateProfileSettings: async (settings: any): Promise<any> => {
    const res = await api.put("/dashboard/student/profile", settings);
    return res.data;
  },

  toggleWishlist: async (courseId: string): Promise<any> => {
    const res = await api.post("/dashboard/student/profile/wishlist", { courseId });
    return res.data;
  },
};
