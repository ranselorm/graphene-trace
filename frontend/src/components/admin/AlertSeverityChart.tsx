import { ChartCard } from "@/components/charts/ChartCard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type AlertSeverityChartProps = {
  high: number;
  medium: number;
  low: number;
};

const COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f97316",
  Low: "#2e5090",
};

export function AlertSeverityChart({
  high,
  medium,
  low,
}: AlertSeverityChartProps) {
  const data = [
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard
      title="Alerts by severity"
      subtitle="Distribution of alert severity levels"
    >
      <div className="h-80 w-full flex flex-col items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-sm -mt-4">
          {data.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[entry.name] }}
              />
              {entry.name} ({entry.value})
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
