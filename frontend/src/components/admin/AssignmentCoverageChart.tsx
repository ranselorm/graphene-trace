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

type AssignmentCoverageChartProps = {
  data: AssignmentData[];
};

export function AssignmentCoverageChart({
  data,
}: AssignmentCoverageChartProps) {
  return (
    <ChartCard
      title="Assignment coverage"
      subtitle="Patients assigned vs unassigned"
    >
      <div className="h-80 w-full">
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
    </ChartCard>
  );
}
