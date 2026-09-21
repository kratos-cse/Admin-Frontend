import { apiFetchData } from "./client";
import type { DashboardData } from "@/types/api";

export function getDashboard() {
  return apiFetchData<DashboardData>("/admin/dashboard", { auth: true });
}
