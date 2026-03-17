import { ChartCard } from "@/components/charts/ChartCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ClinicianWorkloadItem = {
  clinician: string;
  openAlerts: number;
};

type ClinicianWorkloadChartProps = {
  data: ClinicianWorkloadItem[];
};

export function ClinicianWorkloadChart({ data }: ClinicianWorkloadChartProps) {
  const safeData = data.length
    ? data
    : [{ clinician: "No clinicians", openAlerts: 0 }];

  return (
    <ChartCard
      title="Clinician workload balancing"
      subtitle="Open alerts per clinician"
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={safeData}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="category"
              dataKey="clinician"
              width={120}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              formatter={(value) => [`${value ?? 0}`, "Open Alerts"]}
            />
            <Bar dataKey="openAlerts" fill="#2e5090" radius={[0, 6, 6, 0]}>
              <LabelList
                dataKey="openAlerts"
                position="right"
                style={{ fill: "#2e5090", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
