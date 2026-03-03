import { Button } from "@/components/ui/button";
import MetricsCard from "@/components/admin/MetricsCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock chart data
const alertsTrend7Days = [
  { day: "Mon", alerts: 3 },
  { day: "Tue", alerts: 5 },
  { day: "Wed", alerts: 2 },
  { day: "Thu", alerts: 7 },
  { day: "Fri", alerts: 4 },
  { day: "Sat", alerts: 6 },
  { day: "Sun", alerts: 3 },
];

const alertsTrendMonth = [
  { day: "W1", alerts: 14 },
  { day: "W2", alerts: 18 },
  { day: "W3", alerts: 8 },
  { day: "W4", alerts: 24 },
];

const assignmentCoverage = [
  { name: "Assigned", patients: 4 },
  { name: "Unassigned", patients: 1 },
];

function Overview() {
  const [alertsRange, setAlertsRange] = useState<"7d" | "1m">("7d");
  const alertsTrend =
    alertsRange === "7d" ? alertsTrend7Days : alertsTrendMonth;
  const alertsSubtitle =
    alertsRange === "7d"
      ? "Alerts over the last 7 days"
      : "Alerts over the last month";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          label="Total Users"
          value={7}
          change={2}
          icon="clarity:users-line"
        />
        <MetricsCard
          label="Patients"
          value={5}
          change={3}
          icon="material-symbols-light:recent-patient-outline-rounded"
        />
        <MetricsCard
          label="Clinician"
          value={3}
          change={-2}
          icon="healthicons:doctor"
        />
        <MetricsCard
          label="Alerts"
          value={45}
          change={12}
          icon="fluent:alert-24-regular"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
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
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted-foreground)" }}
                />
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

        <ChartCard
          title="Assignment coverage"
          subtitle="Patients assigned vs unassigned"
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={assignmentCoverage}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                accessibilityLayer={false}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)" }}
                />
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
      </div>

      {/* <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((a, idx) => (
              <div
                key={`${a.title}-${idx}`}
                className="rounded-md border border-zinc-800 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-100">
                      {a.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{a.meta}</div>
                  </div>
                  <Badge
                    variant={
                      a.tag === "success"
                        ? "default"
                        : a.tag === "warning"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {a.tag}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base">System status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-zinc-800 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-200">API</div>
                <Badge variant="outline">Online</Badge>
              </div>
              <Separator className="my-3 bg-zinc-800" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-200">Database</div>
                <Badge variant="outline">Online</Badge>
              </div>
              <Separator className="my-3 bg-zinc-800" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-200">Last sync</div>
                <div className="text-xs text-zinc-500">2 mins ago</div>
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-white p-3">
              <div className="text-sm font-medium text-zinc-100">
                Next steps
              </div>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400 list-disc pl-4">
                <li>Create clinician accounts</li>
                <li>Create patient accounts</li>
                <li>Assign clinicians to patients</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}

export default Overview;
