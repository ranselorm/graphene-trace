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
  alerts_generated?: Array<{
    id: number;
    alert_type: string;
    severity: "high" | "medium" | "low";
    trigger_frame: number;
    streak_duration_seconds: number;
    max_risk_score: number;
  }>;
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

type ComparisonDelta = {
  diff: number;
  percent_change: number | null;
  direction: "up" | "down" | "same";
};

type ReportSessionSummary = {
  id: number;
  filename: string;
  session_date: string;
  duration_seconds: number;
  avg_risk_score: number;
  avg_peak_pressure: number;
  avg_contact_area: number;
  avg_pressure: number;
};

type DailyReportSummary = {
  date: string;
  session_count: number;
  total_duration_seconds: number;
  avg_risk_score: number;
  avg_peak_pressure: number;
  avg_contact_area: number;
  avg_pressure: number;
  sessions: ReportSessionSummary[];
};

export type TelemetryReportResponse = {
  patient_id: number;
  report_date?: string;
  today?: DailyReportSummary | null;
  yesterday?: DailyReportSummary | null;
  session_a?: ReportSessionSummary;
  session_b?: ReportSessionSummary;
  comparison: {
    risk_score: ComparisonDelta;
    peak_pressure: ComparisonDelta;
    contact_area: ComparisonDelta;
    avg_pressure: ComparisonDelta;
  } | null;
};

export type FetchTelemetryReportParams = {
  date?: string;
  patientId?: number;
  sessionA?: number;
  sessionB?: number;
};

async function fetchSessions(
  token: string,
  patientId?: number,
): Promise<TelemetrySession[]> {
  const { data } = await axios.get(`${API_BASE}/telemetry/sessions/`, {
    headers: { Authorization: `Bearer ${token}` },
    params: patientId ? { patient_id: patientId } : undefined,
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
  thresholds?: UpdatePatientThresholdsPayload,
): Promise<UploadTelemetryResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (thresholds?.pressure_threshold !== undefined) {
    formData.append(
      "pressure_threshold",
      String(thresholds.pressure_threshold),
    );
  }
  if (thresholds?.contact_area_threshold !== undefined) {
    formData.append(
      "contact_area_threshold",
      String(thresholds.contact_area_threshold),
    );
  }
  if (thresholds?.duration_threshold !== undefined) {
    formData.append(
      "duration_threshold",
      String(thresholds.duration_threshold),
    );
  }

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

async function fetchTelemetryReport(
  token: string,
  params: FetchTelemetryReportParams,
): Promise<TelemetryReportResponse> {
  const { data } = await axios.get(`${API_BASE}/telemetry/report/`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      ...(params.date ? { date: params.date } : {}),
      ...(params.patientId ? { patient_id: params.patientId } : {}),
      ...(params.sessionA ? { session_a: params.sessionA } : {}),
      ...(params.sessionB ? { session_b: params.sessionB } : {}),
    },
  });
  return data;
}

export function useTelemetrySessions(patientId?: number | null) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "sessions", patientId ?? null],
    queryFn: () => fetchSessions(accessToken!, patientId ?? undefined),
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
    mutationFn: async (payload: {
      file: File;
      thresholds?: UpdatePatientThresholdsPayload;
    }) => uploadTelemetryCsv(accessToken!, payload.file, payload.thresholds),
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

export function useTelemetryReport(
  params: FetchTelemetryReportParams,
  options?: { enabled?: boolean },
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["telemetry", "report", params],
    queryFn: () => fetchTelemetryReport(accessToken!, params),
    enabled: !!accessToken && (options?.enabled ?? true),
  });
}
