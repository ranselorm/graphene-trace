import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAlerts,
  useMarkAlertResolved,
  useMarkAlertReviewed,
  type AlertItem,
} from "@/hooks/useAlerts";

function severityBadge(severity: AlertItem["severity"]) {
  if (severity === "high") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
        High
      </Badge>
    );
  }
  if (severity === "medium") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Low
    </Badge>
  );
}

function statusBadge(status: AlertItem["status"]) {
  if (status === "new") {
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">New</Badge>
    );
  }
  if (status === "reviewed") {
    return (
      <Badge className="bg-zinc-200 text-zinc-700 hover:bg-zinc-200">
        Reviewed
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Resolved
    </Badge>
  );
}

export default function Alerts() {
  const PAGE_SIZE = 10;

  const [severityFilter, setSeverityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "new" | "reviewed" | "resolved"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useAlerts({
    severity: severityFilter,
    status: statusFilter,
  });
  const reviewedMutation = useMarkAlertReviewed();
  const resolvedMutation = useMarkAlertResolved();

  const alerts = data?.alerts ?? [];

  useEffect(() => {
    setCurrentPage(1);
  }, [severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE));
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return alerts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [alerts, currentPage]);

  const counts = useMemo(() => {
    return {
      total: alerts.length,
      high: alerts.filter((alert) => alert.severity === "high").length,
      new: alerts.filter((alert) => alert.status === "new").length,
      resolved: alerts.filter((alert) => alert.status === "resolved").length,
    };
  }, [alerts]);

  const markReviewed = (alertId: number) => {
    reviewedMutation.mutate(alertId, {
      onSuccess: () => toast.success("Alert marked as reviewed."),
      onError: () => toast.error("Unable to mark alert as reviewed."),
    });
  };

  const markResolved = (alertId: number) => {
    resolvedMutation.mutate(alertId, {
      onSuccess: () => toast.success("Alert marked as resolved."),
      onError: () => toast.error("Unable to mark alert as resolved."),
    });
  };

  const kpiCards = [
    {
      label: "Total Alerts",
      value: counts.total,
      tone: "blue",
      icon: "mdi:alert-circle-outline",
      accent: "border-blue-100 bg-blue-50 text-blue-700",
      valueClass: "text-zinc-900",
    },
    {
      label: "High Severity",
      value: counts.high,
      tone: "rose",
      icon: "mdi:alert-octagon-outline",
      accent: "border-rose-100 bg-rose-50 text-rose-700",
      valueClass: "text-rose-700",
    },
    {
      label: "New",
      value: counts.new,
      tone: "sky",
      icon: "mdi:bell-outline",
      accent: "border-sky-100 bg-sky-50 text-sky-700",
      valueClass: "text-sky-700",
    },
    {
      label: "Resolved",
      value: counts.resolved,
      tone: "emerald",
      icon: "mdi:check-circle-outline",
      accent: "border-emerald-100 bg-emerald-50 text-emerald-700",
      valueClass: "text-emerald-700",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card
            key={card.label}
            className={`border shadow-none ${card.accent}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600">
                {card.label}
              </CardTitle>
              <div className="rounded-full bg-white/80 p-2 shadow-sm ring-1 ring-black/5">
                <Icon
                  icon={card.icon}
                  className={`text-lg ${card.valueClass}`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold ${card.valueClass}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">Patient Alerts</CardTitle>
          <div className="flex gap-2">
            <Select
              value={severityFilter}
              onValueChange={(value) =>
                setSeverityFilter(value as "all" | "high" | "medium" | "low")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as "all" | "new" | "reviewed" | "resolved",
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading alerts...</p>
          ) : error ? (
            <p className="text-sm text-rose-600">Failed to load alerts.</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No alerts for the selected filters.
            </p>
          ) : (
            <div className="space-y-3">
              {paginatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-900">
                        {alert.patient_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {alert.patient_email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Type: {alert.alert_type} •{" "}
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        {severityBadge(alert.severity)}
                        {statusBadge(alert.status)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          alert.status !== "new" ||
                          reviewedMutation.isPending ||
                          resolvedMutation.isPending
                        }
                        onClick={() => markReviewed(alert.id)}
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        disabled={
                          alert.status === "resolved" ||
                          reviewedMutation.isPending ||
                          resolvedMutation.isPending
                        }
                        onClick={() => markResolved(alert.id)}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, alerts.length)} of{" "}
                  {alerts.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
