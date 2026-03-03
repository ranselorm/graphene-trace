import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  type LatestAlert as AlertDetails,
  SeverityBadge,
  StatusBadge,
} from "@/constants";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900">
        {value ?? <span className="text-zinc-400">Not set</span>}
      </div>
    </div>
  );
}

export function AlertDetailsSheet({
  open,
  onOpenChange,
  alert,
  onResolve,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: AlertDetails | null;
  onResolve?: (alertId: number) => void;
  onCancel?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-md sm:max-w-lg p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Alert details</SheetTitle>
          <SheetDescription>Review the alert and take action.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {!alert ? (
            <div className="text-sm text-zinc-500">No alert selected.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">
                    {alert.label}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {alert.timestamp}
                  </div>
                </div>

                <div className="flex gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <Field label="Patient" value={alert.patientName} />
                <Field label="Assigned clinician" value={alert.clinicianName} />
                <Field label="Sensor frame ID" value={alert.sensorFrameId} />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs text-zinc-500">Notes</div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                  {alert.notes ?? "No notes yet."}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-center gap-2 absolute bottom-6 left-0 right-0 px-6">
                <Button
                  // variant="outline"
                  onClick={() => {
                    onCancel?.();
                    onOpenChange(false);
                  }}
                  className="w-1/2 rounded-none bg-black text-white cursor-pointer hover:hover:bg-zinc-800 transition-all duration-150"
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    onResolve?.(alert.id);
                  }}
                  disabled={alert.status === "resolved"}
                  className="w-1/2 bg-primary rounded-none cursor-pointer transition-all duration-150"
                >
                  Resolve
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
