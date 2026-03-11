import { ChartCard } from "@/components/charts/ChartCard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type AlertStatusChartProps = {
  newCount: number;
  reviewed: number;
  resolved: number;
};

const COLORS: Record<string, string> = {
  New: "#f97316",
  Reviewed: "#2e5090",
  Resolved: "#22c55e",
};

export function AlertStatusChart({
  newCount,
  reviewed,
  resolved,
}: AlertStatusChartProps) {
  const data = [
    { name: "New", value: newCount },
    { name: "Reviewed", value: reviewed },
    { name: "Resolved", value: resolved },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard
      title="Alerts by status"
      subtitle="Breakdown of alert resolution statuses"
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
