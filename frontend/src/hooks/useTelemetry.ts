import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { useAuth } from "@/context/authContext";

const API_BASE = import.meta.env.VITE_BASE_URL;

export type TelemetrySession = {
  id: number;
  session_date: string;
  duration_seconds: number;
  total_frames: number;
  filename: string;
  averages: {
    peak_pressure: number;
    contact_area: number;
    average_pressure: number;
    risk_score: number;
  };
};

export type MetricsPoint = {
  frame_number: number;
  timestamp: string;
  peak_pressure_index: number;
  contact_area_percent: number;
  average_pressure: number;
  risk_score: number;
};

export type SessionMetricsResponse = {
  session_id: number;
  total_frames: number;
  duration_seconds: number;
  averages: {
    peak_pressure: number;
    contact_area: number;
    average_pressure: number;
    risk_score: number;
  };
  timeline: MetricsPoint[];
};

export type SessionFramesResponse = {
  session_id: number;
  start: number;
  end: number;
  total_session_frames: number;
  frames: Array<{
    frame_number: number;
    timestamp: string;
    data: number[][];
  }>;
};

async function fetchSessions(token: string): Promise<TelemetrySession[]> {
  const { data } = await axios.get(`${API_BASE}/telemetry/sessions/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function fetchSessionMetrics(
  token: string,
  sessionId: number,
): Promise<SessionMetricsResponse> {
  const { data } = await axios.get(
    `${API_BASE}/telemetry/sessions/${sessionId}/metrics/`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

async function fetchSessionFrames(
  token: string,
  sessionId: number,
  start: number,
  end: number,
): Promise<SessionFramesResponse> {
  const { data } = await axios.get(
    `${API_BASE}/telemetry/sessions/${sessionId}/frames/?start=${start}&end=${end}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

export function useTelemetrySessions() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "sessions"],
    queryFn: () => fetchSessions(accessToken!),
    enabled: !!accessToken,
  });
}

export function useTelemetrySessionMetrics(sessionId: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "metrics", sessionId],
    queryFn: () => fetchSessionMetrics(accessToken!, sessionId!),
    enabled: !!accessToken && !!sessionId,
  });
}

export function useTelemetrySessionFrames(
  sessionId: number | null,
  start = 0,
  end = 55,
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "frames", sessionId, start, end],
    queryFn: () => fetchSessionFrames(accessToken!, sessionId!, start, end),
    enabled: !!accessToken && !!sessionId,
  });
}
