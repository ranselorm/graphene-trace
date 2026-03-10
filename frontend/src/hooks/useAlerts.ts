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
  const alerts = response ?? [];
  console.log(alerts, "ALERTS");
  //   const count = response?.data?.data?.count ?? 0;
  return { alerts };
};

export const useTransactions = (page: number, limit: number) => {
  //   const token = useSelector((state: RootState) => state.user.token);
  const token = "jjkdjdjkdkdkd";

  return useQuery({
    queryKey: ["alerts", token, page, limit],

    queryFn: async () => {
      const { alerts } = await fetchAlerts(token!, page, limit);
      return { alerts };
    },
    enabled: !!token,
  });
};
