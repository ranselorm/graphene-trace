import MetricsCard from "@/components/admin/MetricsCard";
import { AlertsTrendChart } from "@/components/admin/AlertsTrendChart";
import { AssignmentCoverageChart } from "@/components/admin/AssignmentCoverageChart";
import { AlertSeverityChart } from "@/components/admin/AlertSeverityChart";
import { ClinicianWorkloadChart } from "@/components/admin/ClinicianWorkloadChart";

import { LatestAlertsTable } from "@/components/admin/LatestAlerts";
import { AlertDetailsSheet } from "@/components/admin/AlertDetails";

import { useState } from "react";
import { alertsTrend7Days, alertsTrendMonth } from "@/constants";
import { useAlerts } from "@/hooks/useAlerts";

import { useDetails } from "@/hooks/useAlertDetails";
import { useMarkResolved } from "@/hooks/useMarkResolved";
import { toast } from "sonner";
import { useDasbboard } from "@/hooks/useDashboard";

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
        toast.success("Alert successfully resolved", {
          position: "top-center",
          style: {
            background: "#2e5090",
            color: "#ffffff",
            border: "0.5px solid #dbeafe",
          },
        });
        setSheetOpen(false);
        setSelectedAlertId(null);
      },
    });
  };

  //hooks
  const { data } = useAlerts();
  const { mutate: resolveAlert, isPending: isResolving } = useMarkResolved();

  const { data: overviewData } = useDasbboard();
  const clinicianWorkloadData = overviewData?.clinician_workload?.map(
    (entry: any) => ({
      clinician: entry?.clinician_name ?? "Unknown",
      openAlerts: entry?.open_alerts ?? 0,
    }),
  ) ?? [
    { clinician: "Dr. A. Mensah", openAlerts: 9 },
    { clinician: "Dr. L. Chen", openAlerts: 6 },
    { clinician: "Dr. P. Musa", openAlerts: 4 },
    { clinician: "Dr. E. Grant", openAlerts: 2 },
  ];
  console.log(overviewData?.users);

  if (isResolving) {
    console.log("resolving");
  }

  return (
    <div>
      <div className="space-y-6 container mx-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            label="Total Users"
            value={overviewData?.users?.total}
            change={2}
            icon="clarity:users-line"
            tone="blue"
          />
          <MetricsCard
            label="Patients"
            value={overviewData?.users?.patients}
            change={3}
            icon="material-symbols-light:recent-patient-outline-rounded"
            tone="emerald"
          />
          <MetricsCard
            label="Clinician"
            value={overviewData?.users?.clinicians}
            change={-2}
            icon="healthicons:doctor"
            tone="violet"
          />
          <MetricsCard
            label="Alerts"
            value={overviewData?.alerts?.by_severity?.total}
            change={12}
            icon="fluent:alert-24-regular"
            tone="rose"
          />
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
