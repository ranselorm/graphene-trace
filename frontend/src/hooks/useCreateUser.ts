import { useAuth } from "@/context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type CreateUserRole = "clinician" | "patient";

export type CreateUserInput = {
  full_name: string;
  email: string;
  username: string;
  password: string;
  role: CreateUserRole;
  specialty?: string;
  date_of_birth?: string;
  risk_category?: "low" | "medium" | "high";
};

export const useCreateUser = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint =
        input.role === "clinician"
          ? `${baseUrl}/clinicians/`
          : `${baseUrl}/patients/`;

      const payload =
        input.role === "clinician"
          ? {
              email: input.email,
              password: input.password,
              username: input.username,
              full_name: input.full_name,
              specialty: input.specialty ?? "",
            }
          : {
              email: input.email,
              password: input.password,
              username: input.username,
              full_name: input.full_name,
              date_of_birth: input.date_of_birth || undefined,
              risk_category: input.risk_category || "low",
            };

      const response = await axios.post(endpoint, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["clinicians"] });
    },
  });
};

export const useDeleteUser = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: number;
      role: "clinician" | "patient";
    }) => {
      const base = import.meta.env.VITE_BASE_URL;
      const endpoint =
        role === "clinician"
          ? `${base}/clinicians/${id}/`
          : `${base}/patients/${id}/`;

      const response = await axios.delete(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["clinicians"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
