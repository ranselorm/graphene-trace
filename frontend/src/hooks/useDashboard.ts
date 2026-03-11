import { useAuth } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BASE_URL}/dashboard/stats/`;

const fetchOverview = async (token: string) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data ?? [];
};

export const useDasbboard = () => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchOverview(accessToken!),
    enabled: !!accessToken,
  });
};
