import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export type SessionHeatmapResponse = {
  session_id: number;
  frame_count: number;
  max_value: number;
  heatmap: number[][];
};

export type UploadTelemetryResponse = {
  message: string;
  session_id: number;
  total_frames: number;
  duration_seconds: number;
  averages: {
    peak_pressure: number;
    contact_area: number;
    average_pressure: number;
    risk_score: number;
  };
};

export type ResetTelemetryResponse = {
  message: string;
  deleted_rows: number;
  deleted_csv_files: number;
};

export type PatientThresholdsResponse = {
  patient_id: number | string;
  pressure_threshold: number;
  contact_area_threshold: number;
  duration_threshold: number;
};

export type UpdatePatientThresholdsPayload = Partial<{
  pressure_threshold: number;
  contact_area_threshold: number;
  duration_threshold: number;
}>;

async function fetchSessions(token: string): Promise<TelemetrySession[]> {
  const { data } = await axios.get(`${API_BASE}/telemetry/sessions/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function fetchSessionMetrics(
  token: string,
  sessionId: number,
  period?: "1h" | "6h" | "24h" | "all",
): Promise<SessionMetricsResponse> {
  const { data } = await axios.get(
    `${API_BASE}/telemetry/sessions/${sessionId}/metrics/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: period && period !== "all" ? { period } : undefined,
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

async function fetchSessionHeatmap(
  token: string,
  sessionId: number,
): Promise<SessionHeatmapResponse> {
  const { data } = await axios.get(
    `${API_BASE}/telemetry/sessions/${sessionId}/heatmap/`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

async function uploadTelemetryCsv(
  token: string,
  file: File,
): Promise<UploadTelemetryResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post(`${API_BASE}/telemetry/upload/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

async function resetTelemetry(token: string): Promise<ResetTelemetryResponse> {
  const { data } = await axios.post(
    `${API_BASE}/telemetry/reset/`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return data;
}

async function fetchPatientThresholds(
  token: string,
  patientId: number,
): Promise<PatientThresholdsResponse> {
  const { data } = await axios.get(
    `${API_BASE}/patients/${patientId}/thresholds/`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

async function updatePatientThresholds(
  token: string,
  patientId: number,
  payload: UpdatePatientThresholdsPayload,
): Promise<PatientThresholdsResponse> {
  const { data } = await axios.patch(
    `${API_BASE}/patients/${patientId}/thresholds/`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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

export function useTelemetrySessionMetrics(
  sessionId: number | null,
  period: "1h" | "6h" | "24h" | "all" = "all",
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "metrics", sessionId, period],
    queryFn: () => fetchSessionMetrics(accessToken!, sessionId!, period),
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

export function useTelemetrySessionHeatmap(sessionId: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "heatmap", sessionId],
    queryFn: () => fetchSessionHeatmap(accessToken!, sessionId!),
    enabled: !!accessToken && !!sessionId,
  });
}

export function useUploadTelemetryCsv() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => uploadTelemetryCsv(accessToken!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry", "metrics"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry", "heatmap"] });
    },
  });
}

export function useResetTelemetryData() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => resetTelemetry(accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry", "metrics"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry", "heatmap"] });
    },
  });
}

export function usePatientThresholds(patientId: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["patients", "thresholds", patientId],
    queryFn: () => fetchPatientThresholds(accessToken!, patientId!),
    enabled: !!accessToken && !!patientId,
  });
}

export function useUpdatePatientThresholds(patientId: number | null) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdatePatientThresholdsPayload) =>
      updatePatientThresholds(accessToken!, patientId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patients", "thresholds", patientId],
      });
    },
  });
}
