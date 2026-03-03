import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ActivityType =
  | "alert"
  | "assignment"
  | "comment"
  | "system"
  | "sensor_frame";
type Severity = "low" | "medium" | "high";

export type RecentActivity = {
  id: number;
  type: ActivityType;
  message: string;
  timestamp: string;
  severity?: Severity;
};

function SeverityBadge({ severity }: { severity?: Severity }) {
  if (!severity) return null;

  if (severity === "high") return <Badge variant="destructive">High</Badge>;
  if (severity === "medium") return <Badge variant="secondary">Medium</Badge>;
  return <Badge variant="outline">Low</Badge>;
}

export function RecentActivity({
  title = "Recent activity",
  items,
  maxHeight = 320,
}: {
  title?: string;
  items: RecentActivity[];
  maxHeight?: number;
}) {
  return (
    <Card className="bg-white border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative overflow-y-auto pr-2" style={{ maxHeight }}>
          <ol className="relative pl-7">
            {items.map((item) => (
              <li key={item.id} className="relative pb-8 last:pb-0">
                <span className="absolute left-[6.5px] top-0 h-full w-px bg-gray-300" />
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-secondary ring-1 ring-primary" />

                <div className="flex items-start justify-between gap-3 ml-10">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold ">{item.message}</div>
                    <div className="mt-1 text-xs ">{item.timestamp}</div>
                  </div>

                  {item.type === "alert" ? (
                    <SeverityBadge severity={item.severity} />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
