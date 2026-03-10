import { useAuth } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
// import { RootState } from "@/store/store";

const API_URL = `${import.meta.env.VITE_BASE_URL}/alerts/`;

const fetchAlerts = async (
  token: string,
  page?: number,
  page_size?: number,
) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      page_size,
    },
  });
  const alerts = response?.data ?? [];
  console.log(alerts, "ALERTS");
  //   const count = response?.data?.data?.count ?? 0;
  return { alerts };
};

export const useAlerts = (page?: number, limit?: number) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["alerts", accessToken, page, limit],

    queryFn: async () => {
      const { alerts } = await fetchAlerts(accessToken!, page, limit);
      return { alerts };
    },
    enabled: !!accessToken,
  });
};
