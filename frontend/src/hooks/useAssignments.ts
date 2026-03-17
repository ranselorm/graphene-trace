import { useAuth } from "@/context/authContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const authHeader = (token: string | null) => ({
  Authorization: `Bearer ${token}`,
});

export const useClinicians = () => {
  const { accessToken } = useAuth();
  return useQuery<any[]>({
    queryKey: ["clinicians"],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/clinicians/`,
        { headers: authHeader(accessToken) },
      );
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useAllPatients = () => {
  const { accessToken } = useAuth();
  return useQuery<any[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/patients/`,
        { headers: authHeader(accessToken) },
      );
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useUnassignedPatients = () => {
  const { accessToken } = useAuth();
  return useQuery<any[]>({
    queryKey: ["patients", "unassigned"],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/patients/unassigned/`,
        { headers: authHeader(accessToken) },
      );
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useAssignPatient = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clinicianId,
      patientId,
    }: {
      clinicianId: number;
      patientId: number;
    }) => {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/clinicians/${clinicianId}/assign_patient/`,
        { patient_id: patientId },
        { headers: authHeader(accessToken) },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicians"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

export const useUnassignPatient = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clinicianId,
      patientId,
    }: {
      clinicianId: number;
      patientId: number;
    }) => {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/clinicians/${clinicianId}/unassign_patient/`,
        { patient_id: patientId },
        { headers: authHeader(accessToken) },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicians"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
