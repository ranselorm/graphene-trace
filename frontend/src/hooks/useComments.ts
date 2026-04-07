import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/context/authContext";

const API_BASE = import.meta.env.VITE_BASE_URL;

type CommentPayload = {
  sensor_frame: number;
  body: string;
  parent?: number;
};

export interface CommentResponse {
  id: number;
  sensor_frame: number;
  user: number;
  user_name: string;
  user_email: string;
  user_role: string;
  parent: number | null;
  body: string;
  replies: CommentResponse[];
  created_at: string;
}

async function fetchComments(
  token: string,
  sensorFrameId: number,
): Promise<CommentResponse[]> {
  const { data } = await axios.get(`${API_BASE}/comments/`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { sensor_frame: sensorFrameId },
  });
  return data;
}

async function createComment(
  token: string,
  payload: CommentPayload,
): Promise<CommentResponse> {
  const { data } = await axios.post(`${API_BASE}/comments/`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data;
}

export function useComments(sensorFrameId: number | null) {
  const { accessToken } = useAuth();

  return useQuery<CommentResponse[]>({
    queryKey: ["comments", sensorFrameId],
    queryFn: () => fetchComments(accessToken!, sensorFrameId!),
    enabled: !!accessToken && !!sensorFrameId,
  });
}

export function useCreateComment() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommentPayload) =>
      createComment(accessToken!, payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", payload.sensor_frame],
      });
    },
  });
}
