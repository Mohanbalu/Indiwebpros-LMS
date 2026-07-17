import { api } from "./api";
import type { DashboardResponse } from "@/types/dashboard.types";

export const dashboardService = {
  getFullDashboard: async (): Promise<DashboardResponse> => {
    const res = await api.get("/dashboard/student/");
    return res.data;
  },
};
