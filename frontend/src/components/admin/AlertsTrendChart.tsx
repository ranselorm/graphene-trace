import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/charts/ChartCard";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AlertData = {
  day: string;
  alerts: number;
};

type AlertsTrendChartProps = {
  data7Days: AlertData[];
  dataMonth: AlertData[];
};

export function AlertsTrendChart({
  data7Days,
  dataMonth,
}: AlertsTrendChartProps) {
  const [alertsRange, setAlertsRange] = useState<"7d" | "1m">("7d");
  const alertsTrend = alertsRange === "7d" ? data7Days : dataMonth;
  const alertsSubtitle =
    alertsRange === "7d"
      ? "Alerts over the last 7 days"
      : "Alerts over the last month";

  return (
    <ChartCard title="Alerts trend" subtitle={alertsSubtitle}>
      <div className="mb-3 -mt-4 flex justify-end gap-2">
        <Button
          size="xs"
          variant={alertsRange === "7d" ? "default" : "outline"}
          onClick={() => setAlertsRange("7d")}
        >
          7D
        </Button>
        <Button
          size="xs"
          variant={alertsRange === "1m" ? "default" : "outline"}
          onClick={() => setAlertsRange("1m")}
        >
          1M
        </Button>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={alertsTrend}
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
                borderRadius: "8%",
                color: "var(--foreground)",
              }}
              itemStyle={{ color: "#2e5090" }}
            />
            <Line
              type="monotone"
              dataKey="alerts"
              stroke="#2e5090"
              strokeWidth={1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
