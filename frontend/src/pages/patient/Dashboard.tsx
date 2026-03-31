import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Label,
  Tooltip,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePatientThresholds,
  useUploadTelemetryCsv,
  useUpdatePatientThresholds,
  useTelemetrySessionFrames,
  useTelemetrySessionHeatmap,
  useTelemetrySessionMetrics,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

type HeatCell = {
  color: string;
  value: number;
  row: number;
  col: number;
};

function valueToHeatColor(value: number, maxValue: number): string {
  if (maxValue <= 0) return "#0f172a";

  const ratio = value / maxValue;
  if (ratio < 0.2) return "#1e3a8a";
  if (ratio < 0.45) return "#0ea5e9";
  if (ratio < 0.7) return "#f59e0b";
  return "#dc2626";
}

function ThresholdSettingsCard() {
  const { session } = useAuth();
  const patientId = session?.user?.id ?? null;
  const { data: thresholdsData, isLoading: loadingThresholds } =
    usePatientThresholds(patientId);
  const updateThresholdsMutation = useUpdatePatientThresholds(patientId);

  const [pressureThresholdInput, setPressureThresholdInput] = useState("2000");
  const [contactAreaThresholdInput, setContactAreaThresholdInput] =
    useState("50");
  const [durationThresholdInput, setDurationThresholdInput] = useState("300");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!thresholdsData) return;
    setPressureThresholdInput(String(thresholdsData.pressure_threshold));
    setContactAreaThresholdInput(String(thresholdsData.contact_area_threshold));
    setDurationThresholdInput(String(thresholdsData.duration_threshold));
  }, [thresholdsData]);

  const pressureThresholdValue = Number(pressureThresholdInput);
  const contactAreaThresholdValue = Number(contactAreaThresholdInput);
  const durationThresholdValue = Number(durationThresholdInput);

  const pressureThresholdValid =
    pressureThresholdInput.trim() !== "" &&
    Number.isFinite(pressureThresholdValue) &&
    pressureThresholdValue >= 1 &&
    pressureThresholdValue <= 4095;
  const contactAreaThresholdValid =
    contactAreaThresholdInput.trim() !== "" &&
    Number.isFinite(contactAreaThresholdValue) &&
    contactAreaThresholdValue >= 0 &&
    contactAreaThresholdValue <= 100;
  const durationThresholdValid =
    durationThresholdInput.trim() !== "" &&
    Number.isFinite(durationThresholdValue) &&
    Number.isInteger(durationThresholdValue) &&
    durationThresholdValue >= 0;

  const thresholdsFormValid =
    pressureThresholdValid &&
    contactAreaThresholdValid &&
    durationThresholdValid;

  const clampPressureThreshold = () => {
    const parsed = Number(pressureThresholdInput);
    if (!Number.isFinite(parsed)) {
      setPressureThresholdInput("1");
      return;
    }
    setPressureThresholdInput(
      String(Math.min(4095, Math.max(1, Math.round(parsed)))),
    );
  };

  const clampContactAreaThreshold = () => {
    const parsed = Number(contactAreaThresholdInput);
    if (!Number.isFinite(parsed)) {
      setContactAreaThresholdInput("0");
      return;
    }
    const clamped = Math.min(100, Math.max(0, parsed));
    setContactAreaThresholdInput(clamped.toFixed(1));
  };

  const clampDurationThreshold = () => {
    const parsed = Number(durationThresholdInput);
    if (!Number.isFinite(parsed)) {
      setDurationThresholdInput("0");
      return;
    }
    setDurationThresholdInput(String(Math.max(0, Math.round(parsed))));
  };

  const handleSaveThresholds = () => {
    if (!patientId) {
      toast.error("Unable to determine patient profile.");
      return;
    }

    if (!thresholdsFormValid) {
      toast.error("Please fix threshold values before saving.");
      return;
    }

    updateThresholdsMutation.mutate(
      {
        pressure_threshold: Math.round(pressureThresholdValue),
        contact_area_threshold: Number(contactAreaThresholdValue.toFixed(1)),
        duration_threshold: Math.round(durationThresholdValue),
      },
      {
        onSuccess: () => {
          setLastSavedAt(new Date().toLocaleTimeString());
          toast.success("Thresholds updated successfully.");
        },
        onError: (error) => {
          const message =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { data?: { error?: string } } })
              .response?.data?.error === "string"
              ? (error as { response?: { data?: { error?: string } } }).response
                  ?.data?.error
              : "Failed to update thresholds.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Card className="border-zinc-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg text-zinc-900">
          Pain Threshold Settings
        </CardTitle>
        <p className="text-sm text-zinc-600">
          These values control patient-specific risk scoring and alerts.
        </p>
        <p className="text-xs text-zinc-500">
          Changes apply to new processing and new alerts. Existing session data
          that was already computed may not change retroactively.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Pressure Threshold (1-4095)
          <input
            type="number"
            min={1}
            max={4095}
            value={pressureThresholdInput}
            onChange={(event) => setPressureThresholdInput(event.target.value)}
            onBlur={clampPressureThreshold}
            className="rounded-md border border-zinc-300 px-3 py-2"
            disabled={loadingThresholds || updateThresholdsMutation.isPending}
          />
          {!pressureThresholdValid && (
            <span className="text-xs text-red-600">
              Enter a value between 1 and 4095.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Contact Area Threshold (0-100)
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={contactAreaThresholdInput}
            onChange={(event) =>
              setContactAreaThresholdInput(event.target.value)
            }
            onBlur={clampContactAreaThreshold}
            className="rounded-md border border-zinc-300 px-3 py-2"
            disabled={loadingThresholds || updateThresholdsMutation.isPending}
          />
          {!contactAreaThresholdValid && (
            <span className="text-xs text-red-600">
              Enter a value between 0 and 100.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Duration Threshold (seconds)
          <input
            type="number"
            min={0}
            step={1}
            value={durationThresholdInput}
            onChange={(event) => setDurationThresholdInput(event.target.value)}
            onBlur={clampDurationThreshold}
            className="rounded-md border border-zinc-300 px-3 py-2"
            disabled={loadingThresholds || updateThresholdsMutation.isPending}
          />
          {!durationThresholdValid && (
            <span className="text-xs text-red-600">
              Enter a whole number of seconds (0 or more).
            </span>
          )}
        </label>

        <div className="md:col-span-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {lastSavedAt ? `Last saved at ${lastSavedAt}` : "Not saved yet"}
          </span>
          <Button
            onClick={handleSaveThresholds}
            disabled={
              loadingThresholds ||
              updateThresholdsMutation.isPending ||
              !thresholdsFormValid
            }
          >
            {updateThresholdsMutation.isPending
              ? "Saving..."
              : "Save Thresholds"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientDashboardPage() {
  const { data: sessions = [], isLoading: loadingSessions } =
    useTelemetrySessions();

  const sessionNumberById = useMemo(() => {
    const sortedOldestFirst = [...sessions].sort(
      (a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime(),
    );

    const map: Record<number, number> = {};
    sortedOldestFirst.forEach((session, index) => {
      map[session.id] = index + 1;
    });
    return map;
  }, [sessions]);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [isHeatmapFullscreen, setIsHeatmapFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [timePeriod, setTimePeriod] = useState<"1h" | "6h" | "24h" | "all">(
    "all",
  );
  const [heatmapMode, setHeatmapMode] = useState<"average" | "single">(
    "average",
  );
  const [selectedFrameNumber, setSelectedFrameNumber] = useState(0);

  const uploadMutation = useUploadTelemetryCsv();

  useEffect(() => {
    if (!isHeatmapFullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsHeatmapFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHeatmapFullscreen]);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    setSelectedFrameNumber(0);
  }, [selectedSessionId]);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const selectedSessionNumber = selectedSessionId
    ? sessionNumberById[selectedSessionId]
    : null;

  const { data: metricsData, isLoading: loadingMetrics } =
    useTelemetrySessionMetrics(selectedSessionId);

  const { data: heatmapData, isLoading: loadingHeatmap } =
    useTelemetrySessionHeatmap(selectedSessionId);

  const { data: singleFrameData, isLoading: loadingSingleFrame } =
    useTelemetrySessionFrames(
      selectedSessionId,
      selectedFrameNumber,
      selectedFrameNumber,
    );

  const timeline = metricsData?.timeline ?? [];
  const chartData = useMemo(() => {
    let filteredTimeline = timeline;

    // Filter by time period
    if (timePeriod !== "all" && selectedSession) {
      const durationSeconds = selectedSession.duration_seconds ?? 0;
      const totalFrames = timeline.length;
      const frameRate = totalFrames / durationSeconds;

      // Calculate frame threshold based on time period
      let timeWindowSeconds = durationSeconds;
      if (timePeriod === "1h") {
        timeWindowSeconds = 3600;
      } else if (timePeriod === "6h") {
        timeWindowSeconds = 6 * 3600;
      } else if (timePeriod === "24h") {
        timeWindowSeconds = 24 * 3600;
      }

      // Get frames in the last N seconds (assuming constant frame rate)
      const framesToShow = Math.min(
        Math.ceil(frameRate * timeWindowSeconds),
        totalFrames,
      );
      const startFrame = totalFrames - framesToShow;
      filteredTimeline = timeline.slice(Math.max(0, startFrame));
    }

    const maxPoints = 600;
    if (filteredTimeline.length <= maxPoints) {
      return filteredTimeline.map((item) => ({
        frame: item.frame_number,
        peakPressure: item.peak_pressure_index,
        risk: item.risk_score,
      }));
    }

    const step = Math.ceil(filteredTimeline.length / maxPoints);
    const sampled = [];
    for (let i = 0; i < filteredTimeline.length; i += step) {
      const item = filteredTimeline[i];
      sampled.push({
        frame: item.frame_number,
        peakPressure: item.peak_pressure_index,
        risk: item.risk_score,
      });
    }
    return sampled;
  }, [timeline, timePeriod, selectedSession]);

  const singleFrameGrid = singleFrameData?.frames?.[0]?.data ?? null;
  const sessionHeatGrid =
    heatmapMode === "single" && singleFrameGrid
      ? singleFrameGrid
      : (heatmapData?.heatmap ?? []);

  const maxHeatValue = useMemo(() => {
    if (sessionHeatGrid.length === 0) return 0;
    return Math.max(...sessionHeatGrid.flat());
  }, [sessionHeatGrid]);

  const isHeatmapLoading =
    heatmapMode === "single" ? loadingSingleFrame : loadingHeatmap;

  const heatCells: HeatCell[] = useMemo(
    () =>
      sessionHeatGrid.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => ({
          value,
          color: valueToHeatColor(value, maxHeatValue),
          row: rowIndex,
          col: colIndex,
        })),
      ),
    [sessionHeatGrid, maxHeatValue],
  );

  const averages = metricsData?.averages;

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Select a CSV file first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported.");
      return;
    }

    uploadMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setSelectedSessionId(data.session_id);
        setSelectedFile(null);
        toast.success("CSV uploaded and processed successfully.");
      },
      onError: (error) => {
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } })
            .response?.data?.error === "string"
            ? (error as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Upload failed. Please try again.";
        toast.error(message);
      },
    });
  };

  return (
    <div className="container mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6 md:p-8 animate-in fade-in duration-500">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-cyan-200/40 blur-xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-blue-900/70">
              Live telemetry
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-zinc-900">
              Session pressure heatmap
            </h1>
            <p className="mt-2 text-sm text-zinc-700 max-w-2xl">
              This view is reading directly from the backend telemetry API using
              the selected session and rendering a single pressure map where
              colors show intensity at each sensor point.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-emerald-800">
              <Icon icon="mdi:heart-pulse" className="mr-1" />
              API Connected
            </Badge>
            <Badge className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-blue-800">
              {selectedSession
                ? `Session ${selectedSessionNumber ?? "-"}`
                : "No session"}
            </Badge>
          </div>
        </div>
      </section>

      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">
            Upload New Telemetry CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-zinc-700"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="md:w-auto w-full"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
          </Button>
          {selectedFile && (
            <span className="text-xs text-zinc-500 truncate">
              Selected: {selectedFile.name}
            </span>
          )}
        </CardContent>
      </Card>

      <ThresholdSettingsCard />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-blue-100 bg-white animate-in fade-in slide-in-from-bottom-1 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">
              Avg Peak Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-zinc-900">
                {averages?.peak_pressure?.toFixed(1) ?? "--"}
              </p>
              <span className="text-xs text-emerald-700 bg-emerald-100 rounded-full px-2 py-1">
                from selected session
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">Peak pressure index</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">
              Avg Contact Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-zinc-900">
                {averages?.contact_area?.toFixed(1) ?? "--"}%
              </p>
              <span className="text-xs text-blue-700 bg-blue-100 rounded-full px-2 py-1">
                patient-specific metric
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Pixels above contact baseline
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 bg-white animate-in fade-in slide-in-from-bottom-3 duration-500 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">
              Avg Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-zinc-900">
                {averages?.risk_score?.toFixed(2) ?? "--"}
              </p>
              <span className="text-xs text-violet-700 bg-violet-100 rounded-full px-2 py-1">
                scale 0 to 10
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Computed from pressure and contact thresholds
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-zinc-200 bg-white">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-zinc-900">
              Session Metrics Timeline
            </CardTitle>
            <p className="text-sm text-zinc-600 mt-1">
              Peak pressure and risk score over frame sequence.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Select
              value={selectedSessionId ? String(selectedSessionId) : undefined}
              onValueChange={(value) => setSelectedSessionId(Number(value))}
            >
              <SelectTrigger className="w-55">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={String(session.id)}>
                    Session {sessionNumberById[session.id] ?? "-"} ·{" "}
                    {session.total_frames} frames
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={timePeriod === "1h" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("1h")}
              className="text-xs"
            >
              Last Hour
            </Button>
            <Button
              variant={timePeriod === "6h" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("6h")}
              className="text-xs"
            >
              Last 6h
            </Button>
            <Button
              variant={timePeriod === "24h" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("24h")}
              className="text-xs"
            >
              Last 24h
            </Button>
            <Button
              variant={timePeriod === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("all")}
              className="text-xs"
            >
              All-Time
            </Button>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 md:p-4">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:information-outline"
                className="mt-0.5 text-sky-700"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sky-900">
                  How to read this chart
                </p>
                <p className="text-xs text-sky-800">
                  Pressure values are shown in mmHg (millimeters of mercury), a
                  standard pressure unit. Higher sustained pressure generally
                  means higher tissue risk.
                </p>
                <p className="text-xs text-sky-800">
                  X-axis is frame order (time progression). Red line is peak
                  pressure. Purple line is risk score (0 to 10).
                </p>
                <p className="text-xs text-sky-800">
                  Spikes suggest short high-pressure events. Long high plateaus
                  suggest sustained pressure and should be reviewed.
                </p>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 16, bottom: 28 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="frame"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickMargin={10}
                >
                  <Label
                    value="Frame (time order)"
                    position="insideBottom"
                    offset={-14}
                    fill="#71717a"
                    fontSize={12}
                  />
                </XAxis>
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickMargin={10}
                  width={52}
                >
                  <Label
                    value="Pressure / Risk"
                    angle={-90}
                    position="insideLeft"
                    offset={-2}
                    fill="#71717a"
                    fontSize={12}
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }}
                  labelStyle={{ color: "#18181b", fontWeight: 700 }}
                  labelFormatter={(value) => `Frame ${value}`}
                  formatter={(value, name) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value);

                    if (name === "Peak Pressure") {
                      return [numericValue.toFixed(1), "Pressure Intensity"];
                    }

                    return [numericValue.toFixed(2), "Risk (0-10)"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="peakPressure"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  name="Peak Pressure"
                />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  name="Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Peak Pressure
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Risk Score
            </span>
          </div>
          {(loadingSessions || loadingMetrics) && (
            <p className="mt-2 text-sm text-zinc-500">
              Loading telemetry metrics...
            </p>
          )}
        </CardContent>
      </Card>

      <div
        className={
          isHeatmapFullscreen
            ? "fixed inset-0 z-50 bg-zinc-950/95 p-4 md:p-8 overflow-auto"
            : ""
        }
      >
        <Card
          className={
            isHeatmapFullscreen
              ? "border-zinc-700 bg-zinc-900 min-h-[calc(100vh-2rem)]"
              : "border-zinc-200 bg-white"
          }
        >
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle
                className={
                  isHeatmapFullscreen
                    ? "text-lg text-zinc-100"
                    : "text-lg text-zinc-900"
                }
              >
                Session Pressure Heatmap
              </CardTitle>
              <p
                className={
                  isHeatmapFullscreen
                    ? "text-sm text-zinc-300 mt-1"
                    : "text-sm text-zinc-600 mt-1"
                }
              >
                {heatmapMode === "average"
                  ? "This view averages each cell across all frames in the selected session."
                  : "This view shows one exact frame from the session, matching CSV row and column positions."}{" "}
                Blue is lower pressure and red is higher pressure.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs md:items-end">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={heatmapMode === "average" ? "default" : "outline"}
                  onClick={() => setHeatmapMode("average")}
                >
                  Average Heatmap
                </Button>
                <Button
                  size="sm"
                  variant={heatmapMode === "single" ? "default" : "outline"}
                  onClick={() => setHeatmapMode("single")}
                >
                  Single Frame
                </Button>
                {heatmapMode === "single" && (
                  <label className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        isHeatmapFullscreen ? "text-zinc-300" : "text-zinc-600"
                      }
                    >
                      Frame
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={selectedSession?.total_frames ?? 1}
                      value={selectedFrameNumber + 1}
                      onChange={(event) => {
                        const maxFrames = selectedSession?.total_frames ?? 1;
                        const rawValue = Number(event.target.value);
                        const clamped = Math.min(
                          maxFrames,
                          Math.max(1, Number.isFinite(rawValue) ? rawValue : 1),
                        );
                        setSelectedFrameNumber(clamped - 1);
                      }}
                      className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800"
                    />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    isHeatmapFullscreen
                      ? "inline-flex items-center gap-1 text-zinc-300"
                      : "inline-flex items-center gap-1 text-zinc-600"
                  }
                >
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#1e3a8a]" /> Low
                </span>
                <span
                  className={
                    isHeatmapFullscreen
                      ? "inline-flex items-center gap-1 text-zinc-300"
                      : "inline-flex items-center gap-1 text-zinc-600"
                  }
                >
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#0ea5e9]" />{" "}
                  Medium
                </span>
                <span
                  className={
                    isHeatmapFullscreen
                      ? "inline-flex items-center gap-1 text-zinc-300"
                      : "inline-flex items-center gap-1 text-zinc-600"
                  }
                >
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]" /> High
                </span>
                <span
                  className={
                    isHeatmapFullscreen
                      ? "inline-flex items-center gap-1 text-zinc-300"
                      : "inline-flex items-center gap-1 text-zinc-600"
                  }
                >
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#dc2626]" /> Very
                  high
                </span>
                <Button
                  size="xs"
                  variant={isHeatmapFullscreen ? "secondary" : "outline"}
                  onClick={() => setIsHeatmapFullscreen((prev) => !prev)}
                >
                  <Icon
                    icon={
                      isHeatmapFullscreen
                        ? "mdi:fullscreen-exit"
                        : "mdi:fullscreen"
                    }
                    className="mr-1"
                  />
                  {isHeatmapFullscreen ? "Exit" : "Fullscreen"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isHeatmapLoading ? (
              <p
                className={
                  isHeatmapFullscreen
                    ? "text-sm text-zinc-300"
                    : "text-sm text-zinc-500"
                }
              >
                Loading frame data...
              </p>
            ) : (
              <>
                <div
                  className={
                    isHeatmapFullscreen
                      ? "overflow-auto rounded-xl border border-zinc-700  p-4 relative"
                      : "overflow-x-auto rounded-xl border border-zinc-200  p-3 relative"
                  }
                >
                  <div
                    className="mx-auto grid gap-px"
                    style={{
                      gridTemplateColumns: "repeat(32, minmax(0, 1fr))",
                      width: isHeatmapFullscreen ? "min(98vw, 98vh)" : 700,
                    }}
                  >
                    {heatCells.map((cell, index) => (
                      <div
                        key={index}
                        className="w-full aspect-square relative cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg"
                        style={{ backgroundColor: cell.color }}
                        title={`Row ${cell.row + 1}, Col ${cell.col + 1}\n${cell.value.toFixed(1)} ${heatmapMode === "single" ? "sensor value" : "avg sensor value"}`}
                      />
                    ))}
                  </div>

                  <div
                    className={
                      isHeatmapFullscreen
                        ? "mt-4 flex items-center justify-between text-xs text-zinc-300"
                        : "mt-4 flex items-center justify-between text-xs text-zinc-500"
                    }
                  >
                    {heatmapMode === "single" ? (
                      <>
                        <span>
                          Frame shown: {selectedFrameNumber + 1} of{" "}
                          {selectedSession?.total_frames ?? 0}
                        </span>
                        <span>Peak cell value: {maxHeatValue.toFixed(1)}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Frames aggregated: {heatmapData?.frame_count ?? 0}
                        </span>
                        <span>Peak avg cell: {maxHeatValue.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-zinc-900">
              Live backend checks
            </h2>
            <p className="text-sm text-zinc-600">
              Data source: /api/telemetry/sessions/, /metrics/, and /frames/.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge className="rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700">
              Duration: {selectedSession?.duration_seconds?.toFixed(1) ?? "--"}s
            </Badge>
            <Badge className="rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700">
              Frames: {selectedSession?.total_frames ?? 0}
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
