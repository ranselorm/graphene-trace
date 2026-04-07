import { useAuth } from "@/context/authContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
// import { RootState } from "@/store/store";

const API_URL = `${import.meta.env.VITE_BASE_URL}/alerts/`;

export type AlertItem = {
  id: number;
  patient: number;
  patient_name: string;
  patient_email: string;
  sensor_frame: number;
  alert_type: string;
  severity: "high" | "medium" | "low";
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  updated_at: string;
};

type AlertsQueryFilters = {
  severity?: "high" | "medium" | "low" | "all";
  status?: "new" | "reviewed" | "resolved" | "all";
  patient?: number;
};

const fetchAlerts = async (
  token: string,
  filters?: AlertsQueryFilters,
  page?: number,
  page_size?: number,
) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      ...(filters?.severity && filters.severity !== "all"
        ? { severity: filters.severity }
        : {}),
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.patient ? { patient: filters.patient } : {}),
      page,
      page_size,
    },
  });
  const alerts = (response?.data ?? []) as AlertItem[];
  //   const count = response?.data?.data?.count ?? 0;
  return { alerts };
};

async function markAlertStatus(
  token: string,
  alertId: number,
  action: "mark_reviewed" | "mark_resolved",
) {
  const { data } = await axios.patch(
    `${API_URL}${alertId}/${action}/`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

export const useAlerts = (
  filters?: AlertsQueryFilters,
  page?: number,
  limit?: number,
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["alerts", accessToken, filters, page, limit],

    queryFn: async () => {
      const { alerts } = await fetchAlerts(accessToken!, filters, page, limit);
      return { alerts };
    },
    enabled: !!accessToken,
  });
};

export const useMarkAlertReviewed = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: number) =>
      markAlertStatus(accessToken!, alertId, "mark_reviewed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};

export const useMarkAlertResolved = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: number) =>
      markAlertStatus(accessToken!, alertId, "mark_resolved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
