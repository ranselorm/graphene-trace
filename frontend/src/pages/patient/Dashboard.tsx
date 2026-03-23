import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
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
  useTelemetrySessionFrames,
  useTelemetrySessionMetrics,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";

type HeatCell = {
  color: string;
  value: number;
};

function valueToHeatColor(value: number): string {
  const ratio = Math.max(0, Math.min(1, value / 4095));
  const hue = 220 - 220 * ratio;
  const saturation = 90;
  const lightness = 50 - ratio * 16;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export default function PatientDashboardPage() {
  const { data: sessions = [], isLoading: loadingSessions } =
    useTelemetrySessions();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const { data: metricsData, isLoading: loadingMetrics } =
    useTelemetrySessionMetrics(selectedSessionId);
  const { data: framesData, isLoading: loadingFrames } =
    useTelemetrySessionFrames(selectedSessionId, 0, 55);

  const timeline = metricsData?.timeline ?? [];
  const chartData = useMemo(
    () =>
      timeline.map((item) => ({
        frame: item.frame_number,
        peakPressure: item.peak_pressure_index,
        risk: item.risk_score,
      })),
    [timeline],
  );

  const frames = framesData?.frames ?? [];

  useEffect(() => {
    setFrameIndex(0);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 140);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, frames.length]);

  const activeFrame = frames[frameIndex];
  const heatCells: HeatCell[] = useMemo(() => {
    if (!activeFrame?.data) return [];
    return activeFrame.data.flatMap((row) =>
      row.map((value) => ({
        value,
        color: valueToHeatColor(value),
      })),
    );
  }, [activeFrame]);

  const averages = metricsData?.averages;
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

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
              Pressure map and frame playback
            </h1>
            <p className="mt-2 text-sm text-zinc-700 max-w-2xl">
              This view is reading directly from the backend telemetry API using
              your seeded sessions and rendering raw pressure frames as a
              heatmap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-emerald-800">
              <Icon icon="mdi:heart-pulse" className="mr-1" />
              API Connected
            </Badge>
            <Badge className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-blue-800">
              {selectedSession
                ? `Session #${selectedSession.id}`
                : "No session"}
            </Badge>
          </div>
        </div>
      </section>

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
                  Session {session.id} · {session.total_frames} frames
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="frame"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#71717a", fontSize: 12 }} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }}
                  labelStyle={{ color: "#18181b", fontWeight: 700 }}
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

      <Card className="border-zinc-200 bg-white">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-zinc-900">
              Pressure Heatmap Playback
            </CardTitle>
            <p className="text-sm text-zinc-600 mt-1">
              Raw 32x32 pressure matrix per frame. Blue is lower pressure, red
              is higher.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlaying((current) => !current)}
              disabled={frames.length <= 1}
            >
              <Icon
                icon={isPlaying ? "mdi:pause" : "mdi:play"}
                className="mr-1"
              />
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Badge className="rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700">
              Frame {activeFrame?.frame_number ?? 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingFrames ? (
            <p className="text-sm text-zinc-500">Loading frame data...</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-900/95 p-3">
                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: "repeat(32, minmax(0, 1fr))",
                    width: 360,
                  }}
                >
                  {heatCells.map((cell, index) => (
                    <div
                      key={index}
                      className="h-2.5 w-2.5"
                      style={{ backgroundColor: cell.color }}
                      title={String(cell.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(frames.length - 1, 0)}
                  value={Math.min(frameIndex, Math.max(frames.length - 1, 0))}
                  onChange={(event) =>
                    setFrameIndex(Number(event.target.value))
                  }
                  className="w-full"
                  disabled={frames.length === 0}
                />
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Frame 0</span>
                  <span>
                    {frames.length > 0
                      ? `Frame ${frames.length - 1}`
                      : "No frames"}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
