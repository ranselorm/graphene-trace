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

type QueueFocusItem = {
  name: string;
  value: number;
  color: string;
};

type ClinicalQueueFocusChartProps = {
  assignedPatients: number;
  newAlerts: number;
  pendingComments: number;
  reportsGenerated: number;
};

export function ClinicalQueueFocusChart({
  assignedPatients,
  newAlerts,
  pendingComments,
  reportsGenerated,
}: ClinicalQueueFocusChartProps) {
  const data: QueueFocusItem[] = [
    { name: "Assigned Patients", value: assignedPatients, color: "#2563eb" },
    { name: "New Alerts", value: newAlerts, color: "#d97706" },
    { name: "Comments", value: pendingComments, color: "#16a34a" },
    { name: "Reports", value: reportsGenerated, color: "#7c3aed" },
  ];

  return (
    <ChartCard
      title="Clinical queue focus"
      subtitle="Live snapshot of your active workload"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
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
              dataKey="name"
              width={120}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
