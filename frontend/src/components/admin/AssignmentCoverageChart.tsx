import { ChartCard } from "@/components/charts/ChartCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AssignmentData = {
  name: string;
  patients: number;
};

type ClinicianAssignmentData = {
  clinician: string;
  patients: number;
};

type AssignmentCoverageChartProps = {
  data: AssignmentData[];
  clinicianBreakdown?: ClinicianAssignmentData[];
};

export function AssignmentCoverageChart({
  data,
  clinicianBreakdown = [],
}: AssignmentCoverageChartProps) {
  return (
    <ChartCard
      title="Assignment coverage"
      subtitle="Patients assigned vs unassigned, with clinician breakdown"
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
              <Cell fill="#2e5090" />
              <Cell fill="#DBEAFE" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clinician allocation
          </div>
          <div className="text-xs text-muted-foreground">
            {clinicianBreakdown.length} clinicians
          </div>
        </div>

        {clinicianBreakdown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-sm text-zinc-500">
            No clinician assignment data available.
          </div>
        ) : (
          <div className="space-y-2">
            {clinicianBreakdown.map((entry) => (
              <div
                key={entry.clinician}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
              >
                <div className="truncate pr-3 text-sm text-zinc-700">
                  {entry.clinician}
                </div>
                <div className="shrink-0 text-sm font-medium text-zinc-900">
                  {entry.patients}{" "}
                  {entry.patients === 1 ? "patient" : "patients"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
}
