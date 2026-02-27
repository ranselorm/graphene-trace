import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Stat = {
  label: string;
  value: string;
  hint?: string;
};

type ActivityItem = {
  title: string;
  meta: string;
  tag?: "info" | "warning" | "critical";
};

const stats: Stat[] = [
  { label: "Total users", value: "128", hint: "+6 this week" },
  { label: "Patients", value: "96", hint: "+4 this week" },
  { label: "Clinicians", value: "12", hint: "+1 this week" },
  { label: "Active alerts", value: "7", hint: "2 critical" },
];

const activity: ActivityItem[] = [
  {
    title: "New patient account created",
    meta: "patient_024 • 10 mins ago",
    tag: "info",
  },
  {
    title: "Clinician assigned to patient",
    meta: "clinician_003 → patient_024 • 25 mins ago",
    tag: "info",
  },
  {
    title: "High pressure alert triggered",
    meta: "patient_011 • 1 hour ago",
    tag: "critical",
  },
  {
    title: "Alert marked reviewed",
    meta: "patient_006 • 2 hours ago",
    tag: "warning",
  },
];

function Tag({ tag }: { tag?: ActivityItem["tag"] }) {
  if (!tag) return null;

  if (tag === "critical") return <Badge variant="destructive">Critical</Badge>;
  if (tag === "warning") return <Badge variant="secondary">Warning</Badge>;
  return <Badge variant="outline">Info</Badge>;
}

export function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-zinc-400">
          A quick snapshot of users, assignments, and alerts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-white border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {s.value}
              </div>
              {s.hint ? (
                <div className="mt-1 text-xs text-zinc-500">{s.hint}</div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
                  <Tag tag={a.tag} />
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
      </div>
    </div>
  );
}
