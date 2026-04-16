import { Icon } from "@iconify/react";
import { AlertsTrendChart } from "@/components/admin/AlertsTrendChart";
import { AssignmentCoverageChart } from "@/components/admin/AssignmentCoverageChart";
import { AlertSeverityChart } from "@/components/admin/AlertSeverityChart";
import { ClinicianWorkloadChart } from "@/components/admin/ClinicianWorkloadChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LatestAlertsTable } from "@/components/admin/LatestAlerts";
import { AlertDetailsSheet } from "@/components/admin/AlertDetails";

import { useState } from "react";
import { alertsTrend7Days, alertsTrendMonth } from "@/constants";
import { useAlerts } from "@/hooks/useAlerts";

import { useDetails } from "@/hooks/useAlertDetails";
import { useMarkResolved } from "@/hooks/useMarkResolved";
import { toast } from "sonner";
import { useDasbboard } from "@/hooks/useDashboard";
import { useClinicians } from "@/hooks/useAssignments";

function Overview() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

  const handleView = (alertId: number) => {
    setSelectedAlertId(alertId);
    setSheetOpen(true);
  };

  const { data: alertDetails } = useDetails(
    selectedAlertId ?? undefined,
    sheetOpen,
  );

  const selected = alertDetails
    ? {
        id: alertDetails.id,
        patientName: alertDetails.patient_name,
        alertType: alertDetails.alert_type,
        label: alertDetails.alert_type,
        severity: alertDetails.severity,
        status: alertDetails.status,
        timestamp: alertDetails.created_at,
        clinicianName: alertDetails.clinician_name ?? "Unassigned",
        sensorFrameId: alertDetails.sensor_frame ?? null,
        notes: alertDetails.notes ?? "",
      }
    : null;

  const handleResolve = () => {
    if (!selectedAlertId) return;
    resolveAlert(selectedAlertId, {
      onSuccess: () => {
        toast.success("Alert successfully resolved");
        setSheetOpen(false);
        setSelectedAlertId(null);
      },
    });
  };

  //hooks
  const { data } = useAlerts();
  const { mutate: resolveAlert, isPending: isResolving } = useMarkResolved();

  const { data: overviewData } = useDasbboard();
  const { data: clinicians = [] } = useClinicians();
  const clinicianWorkloadData = (overviewData?.clinician_workload ?? []).map(
    (entry: any) => ({
      clinician: entry?.clinician_name ?? "Unknown",
      openAlerts: entry?.open_alerts ?? 0,
    }),
  );
  console.log(overviewData?.users);

  const clinicianAssignmentBreakdown = clinicians
    .map((clinician: any) => ({
      clinician: clinician.full_name || clinician.username || "Unknown",
      patients: clinician.assigned_patients_count ?? 0,
    }))
    .sort(
      (left: { patients: number }, right: { patients: number }) =>
        right.patients - left.patients,
    );

  const kpiCards = [
    {
      label: "Total Users",
      value: overviewData?.users?.total ?? 0,
      icon: "clarity:users-line",
      accent: "border-blue-100 bg-blue-50 text-blue-700",
      valueClass: "text-blue-700",
    },
    {
      label: "Alerts",
      value: overviewData?.alerts?.by_severity?.total ?? 0,
      icon: "fluent:alert-24-regular",
      accent: "border-rose-100 bg-rose-50 text-rose-700",
      valueClass: "text-rose-700",
    },
    {
      label: "Comments",
      value: overviewData?.comments?.total ?? 0,
      icon: "mdi:comment-multiple-outline",
      accent: "border-emerald-100 bg-emerald-50 text-emerald-700",
      valueClass: "text-emerald-700",
    },
    {
      label: "Feedbacks",
      value: 0,
      icon: "carbon:chat-bot",
      accent: "border-violet-100 bg-violet-50 text-violet-700",
      valueClass: "text-violet-700",
    },
  ] as const;

  if (isResolving) {
    console.log("resolving");
  }

  return (
    <div>
      <div className="space-y-6 container mx-auto">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Card
              key={card.label}
              className={`h-full border shadow-none ${card.accent}`}
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

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <AlertsTrendChart
            data7Days={alertsTrend7Days}
            dataMonth={alertsTrendMonth}
          />
          <AssignmentCoverageChart
            data={
              overviewData?.assignments
                ? [
                    {
                      name: "Assigned",
                      patients: overviewData.assignments.assigned,
                    },
                    {
                      name: "Unassigned",
                      patients: overviewData.assignments.unassigned,
                    },
                  ]
                : []
            }
            clinicianBreakdown={clinicianAssignmentBreakdown}
          />
          <AlertSeverityChart
            high={overviewData?.alerts?.by_severity?.high ?? 0}
            medium={overviewData?.alerts?.by_severity?.medium ?? 0}
            low={overviewData?.alerts?.by_severity?.low ?? 0}
          />
          <ClinicianWorkloadChart data={clinicianWorkloadData} />
        </div>
        {/* <RecentActivityComponent items={recentActivities} maxHeight={320} /> */}
        <LatestAlertsTable items={data} onView={handleView} />

        <AlertDetailsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          alert={selected}
          onResolve={handleResolve}
          // isResolving={isResolving}
        />
      </div>
    </div>
  );
}

export default Overview;
