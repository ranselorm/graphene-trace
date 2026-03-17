import { ChartCard } from "@/components/charts/ChartCard";
import {
  Area,
  AreaChart,
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

export function CommentsToReviewTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard
      title="Comments to review"
      subtitle="Pending patient comments across the week"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            accessibilityLayer={false}
          >
            <defs>
              <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              formatter={(value) => [`${value ?? 0}`, "Pending comments"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#commentsGradient)"
              dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
