import { Icon } from "@iconify/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsTrendChart } from "@/components/admin/AlertsTrendChart";
import { CommentsToReviewTrendChart } from "@/components/clinician/CommentsToReviewTrendChart";
import { ReportsGeneratedTrendChart } from "@/components/clinician/ReportsGeneratedTrendChart";
import { ClinicalQueueFocusChart } from "@/components/clinician/ClinicalQueueFocusChart";
import { useDasbboard } from "@/hooks/useDashboard";

export default function ClinicianOverviewPage() {
  const { data: overviewData } = useDasbboard();

  const newAlerts = overviewData?.alerts?.by_status?.new ?? 0;
  const assignedPatients = overviewData?.assignments?.assigned ?? 0;
  const reportsGenerated = overviewData?.reports?.generated ?? 0;
  const pendingPatientComments =
    overviewData?.comments?.pending_patient_comments ??
    overviewData?.comments?.pending ??
    0;

  const alertsTrend7d =
    overviewData?.trends?.alerts_7d?.map((entry: any) => ({
      day: entry?.day ?? "-",
      alerts: entry?.count ?? 0,
    })) ?? [];

  const alertsTrend1m =
    overviewData?.trends?.alerts_1m?.map((entry: any) => ({
      day: entry?.day ?? "-",
      alerts: entry?.count ?? 0,
    })) ?? [];

  const commentsTrendData =
    overviewData?.comments?.trend_7d?.map((entry: any) => ({
      day: entry?.day ?? "-",
      value: entry?.count ?? 0,
    })) ?? [];

  const reportsTrendData =
    overviewData?.reports?.generated_trend_7d?.map((entry: any) => ({
      day: entry?.day ?? "-",
      value: entry?.count ?? 0,
    })) ?? [];

  const kpiCards = [
    {
      label: "My Active Patients",
      value: assignedPatients,
      icon: "material-symbols-light:recent-patient-outline-rounded",
      accent: "border-blue-100 bg-blue-50 text-blue-700",
      valueClass: "text-blue-700",
    },
    {
      label: "New Alerts",
      value: newAlerts,
      icon: "fluent:alert-24-regular",
      accent: "border-amber-100 bg-amber-50 text-amber-700",
      valueClass: "text-amber-700",
    },
    {
      label: "Comments",
      value: pendingPatientComments,
      icon: "mdi:comment-processing-outline",
      accent: "border-emerald-100 bg-emerald-50 text-emerald-700",
      valueClass: "text-emerald-700",
    },
    {
      label: "Reports",
      value: reportsGenerated,
      icon: "mdi:check-decagram-outline",
      accent: "border-violet-100 bg-violet-50 text-violet-700",
      valueClass: "text-violet-700",
    },
  ] as const;

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <AlertsTrendChart data7Days={alertsTrend7d} dataMonth={alertsTrend1m} />
        <ClinicalQueueFocusChart
          assignedPatients={assignedPatients}
          newAlerts={newAlerts}
          pendingComments={pendingPatientComments}
          reportsGenerated={reportsGenerated}
        />
        <CommentsToReviewTrendChart data={commentsTrendData} />
        <ReportsGeneratedTrendChart data={reportsTrendData} />
      </div>
    </div>
  );
}
