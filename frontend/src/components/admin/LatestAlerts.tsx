import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityBadge, StatusBadge, type LatestAlert } from "@/constants";

export function LatestAlertsTable({
  title = "Latest alerts",
  subtitle = "Most recent alerts across the system",
  items,
  onView,
  onSeeAll,
}: {
  title?: string;
  subtitle?: string;
  items: LatestAlert[];
  onView?: (alertId: number) => void;
  onSeeAll?: () => void;
}) {
  return (
    <Card className="bg-white border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>
        </div>

        <Button variant="outline" className="rounded-lg" onClick={onSeeAll}>
          See all
        </Button>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Alert type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} className="hover:bg-zinc-50">
                  <TableCell className="font-medium text-zinc-900">
                    {a.patientName}
                  </TableCell>

                  <TableCell className="text-zinc-700 capitalize">
                    {/* {prettifyAlertType(a.alertType)} */}
                    {a.label}
                  </TableCell>

                  <TableCell>
                    <SeverityBadge severity={a.severity} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>

                  <TableCell className="text-zinc-600">{a.timestamp}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => onView?.(a.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-zinc-500">
                    No alerts yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
