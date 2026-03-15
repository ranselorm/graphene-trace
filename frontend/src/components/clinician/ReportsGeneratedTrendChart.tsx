import { ChartCard } from "@/components/charts/ChartCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  day: string;
  value: number;
};

export function ReportsGeneratedTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard
      title="Reports generated"
      subtitle="Reports produced over the last 7 days"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)" }} />
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
              formatter={(value) => [`${value ?? 0}`, "Reports"]}
            />
            <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
