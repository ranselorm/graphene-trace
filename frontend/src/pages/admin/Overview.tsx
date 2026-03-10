import MetricsCard from "@/components/admin/MetricsCard";
import { AlertsTrendChart } from "@/components/admin/AlertsTrendChart";
import { AssignmentCoverageChart } from "@/components/admin/AssignmentCoverageChart";

import { LatestAlertsTable } from "@/components/admin/LatestAlerts";
import { AlertDetailsSheet } from "@/components/admin/AlertDetails";

import { useState } from "react";
import {
  alertsTrend7Days,
  alertsTrendMonth,
  assignmentCoverage,
  latestAlerts,
  type LatestAlert as AlertDetails,
} from "@/constants";
import { useAlerts } from "@/hooks/useAlerts";

import { useDetails } from "@/hooks/useAlertDetails";
import { useMarkResolved } from "@/hooks/useMarkResolved";

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
        setSheetOpen(false);
        setSelectedAlertId(null);
      },
    });
  };

  //hooks
  const { data } = useAlerts();
  const { mutate: resolveAlert, isPending: isResolving } = useMarkResolved();

  if (isResolving) {
    console.log("resolving");
  }

  return (
    <div>
      <div className="space-y-6 container mx-auto">
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
          <AlertsTrendChart
            data7Days={alertsTrend7Days}
            dataMonth={alertsTrendMonth}
          />
          <AssignmentCoverageChart data={assignmentCoverage} />
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
