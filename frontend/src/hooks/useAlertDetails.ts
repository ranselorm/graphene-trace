import { useAuth } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BASE_URL}/alerts`;

async function fetchDetails(token: string, alertId: string | number) {
  const { data } = await axios.get(`${API_URL}/${alertId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export function useDetails(alertId?: string | number, enabled: boolean = true) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["alert-details", alertId],
    queryFn: () => fetchDetails(accessToken!, alertId!),
    enabled: enabled && !!accessToken && !!alertId,
    staleTime: 5 * 60 * 1000,
  });
}
