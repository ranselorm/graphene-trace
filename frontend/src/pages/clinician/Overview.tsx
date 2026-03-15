import MetricsCard from "@/components/admin/MetricsCard";
import { AlertsTrendChart } from "@/components/admin/AlertsTrendChart";
import { alertsTrend7Days, alertsTrendMonth } from "@/constants";
import { CommentsToReviewTrendChart } from "@/components/clinician/CommentsToReviewTrendChart";
import { ReportsGeneratedTrendChart } from "@/components/clinician/ReportsGeneratedTrendChart";
import { ClinicalQueueFocusChart } from "@/components/clinician/ClinicalQueueFocusChart";
import { useDasbboard } from "@/hooks/useDashboard";

export default function ClinicianOverviewPage() {
  const { data: overviewData } = useDasbboard();

  const newAlerts = overviewData?.alerts?.by_status?.new ?? 0;
  const resolvedAlerts = overviewData?.alerts?.by_status?.resolved ?? 0;
  const assignedPatients = overviewData?.assignments?.assigned ?? 0;
  const pendingPatientComments =
    overviewData?.comments?.pending_patient_comments ??
    overviewData?.comments?.pending ??
    0;

  const commentsTrendData = overviewData?.comments?.trend_7d?.map(
    (entry: any) => ({
      day: entry?.day ?? "-",
      value: entry?.count ?? 0,
    }),
  ) ?? [
    { day: "Mon", value: 6 },
    { day: "Tue", value: 4 },
    { day: "Wed", value: 5 },
    { day: "Thu", value: 3 },
    { day: "Fri", value: 4 },
    { day: "Sat", value: 2 },
    { day: "Sun", value: 3 },
  ];

  const reportsTrendData = overviewData?.reports?.generated_trend_7d?.map(
    (entry: any) => ({
      day: entry?.day ?? "-",
      value: entry?.count ?? 0,
    }),
  ) ?? [
    { day: "Mon", value: 1 },
    { day: "Tue", value: 2 },
    { day: "Wed", value: 1 },
    { day: "Thu", value: 3 },
    { day: "Fri", value: 2 },
    { day: "Sat", value: 1 },
    { day: "Sun", value: 2 },
  ];

  return (
    <div>
      <div className="space-y-6 container mx-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            label="My Active Patients"
            value={assignedPatients}
            change={6}
            icon="material-symbols-light:recent-patient-outline-rounded"
            tone="blue"
          />
          <MetricsCard
            label="New Alerts"
            value={newAlerts}
            change={4}
            icon="fluent:alert-24-regular"
            tone="amber"
          />
          <MetricsCard
            label="Comments"
            value={pendingPatientComments}
            change={1}
            icon="mdi:comment-processing-outline"
            tone="emerald"
          />
          <MetricsCard
            label="Reports"
            value={resolvedAlerts}
            change={9}
            icon="mdi:check-decagram-outline"
            tone="violet"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <AlertsTrendChart
            data7Days={alertsTrend7Days}
            dataMonth={alertsTrendMonth}
          />
          <ClinicalQueueFocusChart
            assignedPatients={assignedPatients}
            newAlerts={newAlerts}
            pendingComments={pendingPatientComments}
            reportsGenerated={resolvedAlerts}
          />
          <CommentsToReviewTrendChart data={commentsTrendData} />
          <ReportsGeneratedTrendChart data={reportsTrendData} />
        </div>
      </div>
    </div>
  );
}
