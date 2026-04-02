import { useEffect, useMemo, useState } from "react";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAlerts } from "@/hooks/useAlerts";
import {
  useTelemetrySessionFrames,
  useTelemetrySessionHeatmap,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";

export type ClinicianPatient = {
  id: number;
  full_name: string;
  email: string;
  risk_category: string;
};

type HeatCell = {
  color: string;
  value: number;
  row: number;
  col: number;
};

function riskBadge(risk: string) {
  if (risk === "high") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
        High
      </Badge>
    );
  }

  if (risk === "medium") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Medium
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Low
    </Badge>
  );
}

function alertTypeLabel(alertType: string) {
  return alertType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function valueToHeatColor(value: number, maxValue: number): string {
  if (maxValue <= 0) return "#0f172a";

  const ratio = value / maxValue;
  if (ratio < 0.2) return "#1e3a8a";
  if (ratio < 0.45) return "#0ea5e9";
  if (ratio < 0.7) return "#f59e0b";
  return "#dc2626";
}

export function PatientDetailSheet({
  patient,
  open,
  onOpenChange,
}: {
  patient: ClinicianPatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const patientId = patient?.id ?? null;
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [heatmapMode, setHeatmapMode] = useState<"average" | "single">(
    "average",
  );
  const [selectedFrameNumber, setSelectedFrameNumber] = useState(0);

  const { data: sessions = [], isLoading: loadingSessions } =
    useTelemetrySessions(patientId);
  const { data: heatmapData, isLoading: loadingHeatmap } =
    useTelemetrySessionHeatmap(selectedSessionId);
  const { data: singleFrameData, isLoading: loadingSingleFrame } =
    useTelemetrySessionFrames(
      selectedSessionId,
      selectedFrameNumber,
      selectedFrameNumber,
    );
  const { data: alertsData, isLoading: loadingAlerts } = useAlerts({
    patient: patientId ?? undefined,
  });

  const patientAlerts = alertsData?.alerts ?? [];

  useEffect(() => {
    if (!open) return;

    if (sessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId((currentSessionId) => {
      if (
        currentSessionId &&
        sessions.some((session) => session.id === currentSessionId)
      ) {
        return currentSessionId;
      }

      const latestSession = [...sessions].sort(
        (left, right) =>
          new Date(right.session_date).getTime() -
          new Date(left.session_date).getTime(),
      )[0];
      return latestSession?.id ?? null;
    });
  }, [open, sessions]);

  useEffect(() => {
    setSelectedFrameNumber(0);
  }, [selectedSessionId]);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const sessionHeatGrid =
    heatmapMode === "single"
      ? (singleFrameData?.frames?.[0]?.data ?? [])
      : (heatmapData?.heatmap ?? []);

  const maxHeatValue = useMemo(() => {
    if (sessionHeatGrid.length === 0) return 0;
    return Math.max(...sessionHeatGrid.flat());
  }, [sessionHeatGrid]);

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

  const isHeatmapLoading =
    heatmapMode === "single" ? loadingSingleFrame : loadingHeatmap;
  const recentAlerts = patientAlerts.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-zinc-200 px-6 py-5">
          <SheetTitle className="text-left text-xl">
            {patient?.full_name ?? "Patient details"}
          </SheetTitle>
          <SheetDescription className="text-left">
            Heatmap, sessions, and recent alerts for the selected patient.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-zinc-500">
                  Assigned risk
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                {patient ? riskBadge(patient.risk_category) : null}
                <span className="text-xs text-zinc-500">Live assignment</span>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-zinc-500">
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-zinc-900">
                {loadingSessions ? "--" : sessions.length}
              </CardContent>
            </Card>
            <Card className="border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-zinc-500">
                  Recent alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-zinc-900">
                {loadingAlerts ? "--" : patientAlerts.length}
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-200 shadow-none">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg text-zinc-900">
                  Session Heatmap
                </CardTitle>
                <p className="text-sm text-zinc-600">
                  Select a session to inspect pressure intensity.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={
                    selectedSessionId ? String(selectedSessionId) : undefined
                  }
                  onValueChange={(value) => setSelectedSessionId(Number(value))}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={String(session.id)}>
                        {new Date(session.session_date).toLocaleDateString()} ·{" "}
                        {session.total_frames} frames
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={heatmapMode === "average" ? "default" : "outline"}
                    onClick={() => setHeatmapMode("average")}
                  >
                    Average
                  </Button>
                  <Button
                    size="sm"
                    variant={heatmapMode === "single" ? "default" : "outline"}
                    onClick={() => setHeatmapMode("single")}
                  >
                    Single Frame
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {loadingSessions || isHeatmapLoading ? (
                <p className="text-sm text-zinc-500">Loading heatmap data...</p>
              ) : selectedSessionId === null ? (
                <p className="text-sm text-zinc-500">
                  No telemetry sessions available for this patient.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 p-3">
                    <div
                      className="mx-auto grid gap-px"
                      style={{
                        gridTemplateColumns: "repeat(32, minmax(0, 1fr))",
                        width: "min(100%, 700px)",
                      }}
                    >
                      {heatCells.map((cell, index) => (
                        <div
                          key={index}
                          className="aspect-square w-full transition-all hover:z-10 hover:scale-110 hover:shadow-lg"
                          style={{ backgroundColor: cell.color }}
                          title={`Row ${cell.row + 1}, Col ${cell.col + 1}\n${cell.value.toFixed(1)} ${
                            heatmapMode === "single"
                              ? "sensor value"
                              : "avg sensor value"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                    {heatmapMode === "single" ? (
                      <>
                        <span>
                          Frame shown: {selectedFrameNumber + 1} of{" "}
                          {selectedSession?.total_frames ?? 0}
                        </span>
                        <span>
                          Frame date:{" "}
                          {singleFrameData?.frames?.[0]?.timestamp
                            ? new Date(
                                singleFrameData.frames[0].timestamp,
                              ).toLocaleString()
                            : "--"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Frame</span>
                          <input
                            type="number"
                            min={1}
                            max={selectedSession?.total_frames ?? 1}
                            value={selectedFrameNumber + 1}
                            onChange={(event) => {
                              const maxFrames =
                                selectedSession?.total_frames ?? 1;
                              const rawValue = Number(event.target.value);
                              const clamped = Math.min(
                                maxFrames,
                                Math.max(
                                  1,
                                  Number.isFinite(rawValue) ? rawValue : 1,
                                ),
                              );
                              setSelectedFrameNumber(clamped - 1);
                            }}
                            className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800"
                          />
                        </div>
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
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900">
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No alerts found for this patient.
                </p>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-zinc-200 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {alertTypeLabel(alert.alert_type)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                          {alert.severity}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
