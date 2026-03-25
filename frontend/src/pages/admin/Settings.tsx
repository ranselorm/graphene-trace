import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetTelemetryData } from "@/hooks/useTelemetry";

const Settings = () => {
  const resetTelemetryMutation = useResetTelemetryData();

  const handleResetTelemetry = () => {
    const confirmReset = window.confirm(
      "This will delete all telemetry sessions and CSV files. Continue?",
    );
    if (!confirmReset) return;

    resetTelemetryMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(
          `${data.message}. Rows deleted: ${data.deleted_rows}, files deleted: ${data.deleted_csv_files}`,
        );
      },
      onError: () => {
        toast.error("Failed to reset telemetry data.");
      },
    });
  };

  return (
    <div className="container mx-auto space-y-6">
      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">
            Telemetry Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-600">
            Use this to wipe telemetry sessions and uploaded CSV files before a
            fresh ingestion cycle.
          </p>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleResetTelemetry}
            disabled={resetTelemetryMutation.isPending}
          >
            {resetTelemetryMutation.isPending
              ? "Resetting..."
              : "Reset Telemetry Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
