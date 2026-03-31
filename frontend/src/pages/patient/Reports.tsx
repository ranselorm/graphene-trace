import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTelemetryReport } from "@/hooks/useTelemetry";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

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
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [sessionA, setSessionA] = useState<string>("");
  const [sessionB, setSessionB] = useState<string>("");

  const {
    data: dailyReport,
    isLoading: dailyLoading,
    error: dailyError,
    refetch: refetchDaily,
  } = useTelemetryReport({ date: reportDate });

  const {
    data: sessionCompare,
    isLoading: compareLoading,
    error: compareError,
  } = useTelemetryReport(
    {
      sessionA: sessionA ? Number(sessionA) : undefined,
      sessionB: sessionB ? Number(sessionB) : undefined,
    },
    { enabled: !!sessionA && !!sessionB },
  );

  const sessionOptions = useMemo(() => {
    const today = dailyReport?.today?.sessions ?? [];
    const yesterday = dailyReport?.yesterday?.sessions ?? [];
    const merged = [...today, ...yesterday];

    return merged.map((session, index) => ({
      id: String(session.id),
      label: `Session ${index + 1} - ${new Date(session.session_date).toLocaleString()}`,
    }));
  }, [dailyReport]);

  const activeComparison =
    sessionCompare?.comparison ?? dailyReport?.comparison;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-xl text-zinc-900">
              Patient Report
            </CardTitle>
            <p className="text-sm text-zinc-600">
              Compare selected day activity with the previous day and optionally
              compare any two sessions.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Report Date
              <input
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <Button onClick={() => refetchDaily()} disabled={dailyLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {dailyError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">
            Unable to load report for this date.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900">
              Selected Day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dailyLoading ? (
              <p className="text-zinc-500">Loading selected day data...</p>
            ) : dailyReport?.today ? (
              <>
                <p className="text-zinc-700">Date: {dailyReport.today.date}</p>
                <p className="text-zinc-700">
                  Sessions: {dailyReport.today.session_count}
                </p>
                <p className="text-zinc-700">
                  Total Duration:{" "}
                  {formatDuration(dailyReport.today.total_duration_seconds)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">
                    Risk: {dailyReport.today.avg_risk_score.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Peak: {dailyReport.today.avg_peak_pressure.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Contact: {dailyReport.today.avg_contact_area.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Avg Pressure: {dailyReport.today.avg_pressure.toFixed(2)}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-zinc-500">
                No sessions found for selected date.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900">
              Previous Day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dailyLoading ? (
              <p className="text-zinc-500">Loading previous day data...</p>
            ) : dailyReport?.yesterday ? (
              <>
                <p className="text-zinc-700">
                  Date: {dailyReport.yesterday.date}
                </p>
                <p className="text-zinc-700">
                  Sessions: {dailyReport.yesterday.session_count}
                </p>
                <p className="text-zinc-700">
                  Total Duration:{" "}
                  {formatDuration(dailyReport.yesterday.total_duration_seconds)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">
                    Risk: {dailyReport.yesterday.avg_risk_score.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Peak: {dailyReport.yesterday.avg_peak_pressure.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Contact: {dailyReport.yesterday.avg_contact_area.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    Avg Pressure:{" "}
                    {dailyReport.yesterday.avg_pressure.toFixed(2)}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-zinc-500">
                No sessions found for previous day.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">
            Session-to-Session Compare
          </CardTitle>
          <p className="text-sm text-zinc-600">
            Choose two sessions from the loaded report window for direct
            comparison.
          </p>
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
            {compareLoading && !!sessionA && !!sessionB && (
              <p>Loading session comparison...</p>
            )}
            {compareError && !!sessionA && !!sessionB && (
              <p className="text-red-600">
                Failed to compare selected sessions.
              </p>
            )}
            {!sessionA || !sessionB ? (
              <p>Select two sessions to run direct comparison.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">
            Comparison Summary
          </CardTitle>
          <p className="text-sm text-zinc-600">
            Displays selected-day vs previous-day changes unless two sessions
            are selected above.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {activeComparison ? (
            <>
              <DeltaText
                label="Risk Score"
                diff={activeComparison.risk_score.diff}
                percent={activeComparison.risk_score.percent_change}
                direction={activeComparison.risk_score.direction}
              />
              <DeltaText
                label="Peak Pressure"
                diff={activeComparison.peak_pressure.diff}
                percent={activeComparison.peak_pressure.percent_change}
                direction={activeComparison.peak_pressure.direction}
              />
              <DeltaText
                label="Contact Area"
                diff={activeComparison.contact_area.diff}
                percent={activeComparison.contact_area.percent_change}
                direction={activeComparison.contact_area.direction}
              />
              <DeltaText
                label="Average Pressure"
                diff={activeComparison.avg_pressure.diff}
                percent={activeComparison.avg_pressure.percent_change}
                direction={activeComparison.avg_pressure.direction}
              />
            </>
          ) : (
            <p className="text-sm text-zinc-500 md:col-span-2 lg:col-span-4">
              Comparison appears when both selected day and previous day have
              sessions, or when two sessions are selected above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
