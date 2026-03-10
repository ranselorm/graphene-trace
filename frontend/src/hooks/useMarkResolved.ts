import { useAuth } from "@/context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BASE_URL}/alerts`;

async function markResolved(token: string, alertId: number) {
  const { data } = await axios.patch(
    `${API_URL}/${alertId}/mark_resolved/`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

export function useMarkResolved() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: number) => markResolved(accessToken!, alertId),
    onSuccess: (_, alertId) => {
      // Refetch the alert details and alerts list after resolving
      queryClient.invalidateQueries({ queryKey: ["alert-details", alertId] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
