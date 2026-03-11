import { useAuth } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BASE_URL}/auth/get_all_users/`;

const fetchUsers = async (
  token: string,
  page?: number,
  page_size?: number,
  search?: string,
) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      page_size,
      ...(search ? { search } : {}),
    },
  });

  const users = response?.data ?? [];

  return { users };
};

export const useUsers = (page?: number, limit?: number, search?: string) => {
  const { accessToken } = useAuth();

  return useQuery<any, Error>({
    queryKey: ["users", accessToken, search, page, limit],
    queryFn: async () => {
      const { users } = await fetchUsers(accessToken!, page, limit, search);
      return { users };
    },
    enabled: !!accessToken,
  });
};
