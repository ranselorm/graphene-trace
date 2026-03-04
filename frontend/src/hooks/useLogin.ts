import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const loginUrl = "http://localhost:8000/api/auth/login/";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await axios.post(loginUrl, data, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    },
  });
};
