import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  useTelemetrySessionComparison,
  useTelemetrySessionReport,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function deltaTone(direction: "up" | "down" | "same") {
  if (direction === "up") return "text-red-600";
  if (direction === "down") return "text-emerald-600";
  return "text-zinc-600";
}

function DeltaText({
  label,
  diff,
  percent,
  direction,
}: {
  label: string;
  diff: number;
  percent: number | null;
  direction: "up" | "down" | "same";
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`text-sm font-medium ${deltaTone(direction)}`}>
        {diff >= 0 ? "+" : ""}
        {diff.toFixed(2)}
        {percent !== null ? ` (${percent >= 0 ? "+" : ""}${percent}%)` : ""}
      </p>
    </div>
  );
}

export default function PatientReports() {
  const { data: sessions = [], isLoading: loadingSessions } =
    useTelemetrySessions();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionA, setSessionA] = useState<string>("");
  const [sessionB, setSessionB] = useState<string>("");

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  const {
    data: sessionReport,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useTelemetrySessionReport(selectedSessionId);

  const {
    data: sessionCompare,
    isLoading: compareLoading,
    error: compareError,
  } = useTelemetrySessionComparison(
    sessionA ? Number(sessionA) : null,
    sessionB ? Number(sessionB) : null,
  );

  const comparison = sessionCompare?.comparison ?? null;

  const chartData = useMemo(() => {
    const timeline = sessionReport?.pressure_over_time ?? [];
    const maxPoints = 600;

    if (timeline.length <= maxPoints) {
      return timeline.map((item) => ({
        frame: item.frame_number,
        peakPressure: item.peak_pressure_index,
        risk: item.risk_score,
      }));
    }

    const step = Math.ceil(timeline.length / maxPoints);
    const sampled: Array<{ frame: number; peakPressure: number; risk: number }> = [];

    for (let index = 0; index < timeline.length; index += step) {
      const item = timeline[index];
      sampled.push({
        frame: item.frame_number,
        peakPressure: item.peak_pressure_index,
        risk: item.risk_score,
      });
    }

    return sampled;
  }, [sessionReport]);

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        id: String(session.id),
        label: `${new Date(session.session_date).toLocaleString()} • ${session.filename}`,
      })),
    [sessions],
  );

  const activeComparison = sessionCompare ? comparison : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="border-zinc-200 bg-white shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-xl text-zinc-900">Patient Report</CardTitle>
            <p className="text-sm text-zinc-600">
              View a report for one uploaded session and optionally compare two sessions.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Session
              <Select
                value={selectedSessionId ? String(selectedSessionId) : undefined}
                onValueChange={(value) => setSelectedSessionId(Number(value))}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={String(session.id)}>
                      {new Date(session.session_date).toLocaleDateString()} • {session.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button onClick={() => refetchReport()} disabled={reportLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {reportError && (
        <Card className="border-red-200 bg-red-50 shadow-none">
          <CardContent className="pt-6 text-sm text-red-700">
            Unable to load report for the selected session.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Selected Session</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-900">
            {loadingSessions ? "Loading sessions..." : selectedSession?.filename ?? "No session selected"}
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Frames</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-zinc-900">
            {sessionReport?.total_frames ?? selectedSession?.total_frames ?? "--"}
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Duration</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-zinc-900">
            {sessionReport ? formatDuration(sessionReport.duration_seconds) : selectedSession ? formatDuration(selectedSession.duration_seconds) : "--"}
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Avg Risk</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-zinc-900">
            {sessionReport?.avg_risk_score?.toFixed(2) ?? selectedSession?.averages.risk_score?.toFixed(2) ?? "--"}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900">Highest and Lowest Risk Frames</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {reportLoading ? (
              <p className="text-zinc-500">Loading report...</p>
            ) : sessionReport ? (
              <>
                <div className="rounded-md border border-zinc-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Highest risk</p>
                  <p className="text-zinc-900">
                    Frame {sessionReport.highest_risk_frame?.frame_number ?? "--"} • Risk {sessionReport.highest_risk_frame?.risk_score?.toFixed(2) ?? "--"}
                  </p>
                  <p className="text-zinc-600">
                    Peak pressure {sessionReport.highest_risk_frame?.peak_pressure?.toFixed(2) ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border border-zinc-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Lowest risk</p>
                  <p className="text-zinc-900">
                    Frame {sessionReport.lowest_risk_frame?.frame_number ?? "--"} • Risk {sessionReport.lowest_risk_frame?.risk_score?.toFixed(2) ?? "--"}
                  </p>
                  <p className="text-zinc-600">
                    Peak pressure {sessionReport.lowest_risk_frame?.peak_pressure?.toFixed(2) ?? "--"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">Peak: {sessionReport.avg_peak_pressure.toFixed(2)}</Badge>
                  <Badge variant="outline">Contact: {sessionReport.avg_contact_area.toFixed(2)}</Badge>
                  <Badge variant="outline">Pressure: {sessionReport.avg_pressure.toFixed(2)}</Badge>
                </div>
              </>
            ) : (
              <p className="text-zinc-500">Select a session to view its report.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900">Pressure / Risk Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-80 w-full">
            {reportLoading ? (
              <p className="text-sm text-zinc-500">Loading chart...</p>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-zinc-500">No frame data found for this session.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 12, left: 16, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="frame" tick={{ fill: "#71717a", fontSize: 12 }} tickMargin={10}>
                    <Label value="Frame" position="insideBottom" offset={-14} fill="#71717a" fontSize={12} />
                  </XAxis>
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} tickMargin={10} width={52}>
                    <Label value="Pressure / Risk" angle={-90} position="insideLeft" offset={-2} fill="#71717a" fontSize={12} />
                  </YAxis>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }}
                    labelStyle={{ color: "#18181b", fontWeight: 700 }}
                    labelFormatter={(value) => `Frame ${value}`}
                    formatter={(value, name) => {
                      const numericValue = typeof value === "number" ? value : Number(value);
                      if (name === "Peak Pressure") return [numericValue.toFixed(1), "Pressure"];
                      return [numericValue.toFixed(2), "Risk (0-10)"];
                    }}
                  />
                  <Line type="monotone" dataKey="peakPressure" stroke="#ef4444" strokeWidth={3} dot={{ r: 2 }} name="Peak Pressure" />
                  <Line type="monotone" dataKey="risk" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 2 }} name="Risk Score" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">Session-to-Session Compare</CardTitle>
          <p className="text-sm text-zinc-600">Select two uploaded sessions to compare them directly.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Select value={sessionA} onValueChange={setSessionA}>
            <SelectTrigger>
              <SelectValue placeholder="Select Session A" />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sessionB} onValueChange={setSessionB}>
            <SelectTrigger>
              <SelectValue placeholder="Select Session B" />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="md:col-span-2 text-sm text-zinc-500">
            {compareLoading && !!sessionA && !!sessionB && <p>Loading session comparison...</p>}
            {compareError && !!sessionA && !!sessionB && (
              <p className="text-red-600">Failed to compare selected sessions.</p>
            )}
            {!sessionA || !sessionB ? <p>Select two sessions to run direct comparison.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">Comparison Summary</CardTitle>
          <p className="text-sm text-zinc-600">Displays the comparison for the two selected sessions.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {activeComparison ? (
            <>
              <DeltaText label="Risk Score" diff={activeComparison.risk_score.diff} percent={activeComparison.risk_score.percent_change} direction={activeComparison.risk_score.direction} />
              <DeltaText label="Peak Pressure" diff={activeComparison.peak_pressure.diff} percent={activeComparison.peak_pressure.percent_change} direction={activeComparison.peak_pressure.direction} />
              <DeltaText label="Contact Area" diff={activeComparison.avg_contact_area.diff} percent={activeComparison.avg_contact_area.percent_change} direction={activeComparison.avg_contact_area.direction} />
              <DeltaText label="Average Pressure" diff={activeComparison.avg_pressure.diff} percent={activeComparison.avg_pressure.percent_change} direction={activeComparison.avg_pressure.direction} />
            </>
          ) : (
            <p className="text-sm text-zinc-500 md:col-span-2 lg:col-span-4">
              Comparison appears when two sessions are selected above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
