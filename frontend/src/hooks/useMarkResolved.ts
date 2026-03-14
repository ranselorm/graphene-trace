import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/context/authContext";

const API_URL = `${import.meta.env.VITE_BASE_URL}/alerts`;

export const useMarkResolved = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: number) => {
      await axios.patch(
        `${API_URL}/${alertId}/mark_resolved/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    },
    onSuccess: (_data, alertId) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-details", alertId] });
    },
  });
};
