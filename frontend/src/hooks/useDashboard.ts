import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard.types";

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["studentDashboard"],
    queryFn: async () => {
      const res = await dashboardService.getFullDashboard();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
