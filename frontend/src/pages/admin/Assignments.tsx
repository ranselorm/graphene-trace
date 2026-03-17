import React, { useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials } from "@/constants";
import {
  useAllPatients,
  useAssignPatient,
  useClinicians,
  useUnassignedPatients,
  useUnassignPatient,
} from "@/hooks/useAssignments";

function RiskBadge({ risk }: { risk?: string }) {
  if (risk === "high")
    return (
      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 shrink-0">
        High
      </Badge>
    );
  if (risk === "medium")
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shrink-0">
        Medium
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shrink-0">
      Low
    </Badge>
  );
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data as any;
    return d?.error || d?.detail || error.message || "Something went wrong";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function Assignments() {
  const [assignTarget, setAssignTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );

  const { data: clinicians = [], isLoading: loadingClinicians } =
    useClinicians();
  const { data: patients = [], isLoading: loadingPatients } = useAllPatients();
  const { data: unassigned = [] } = useUnassignedPatients();
  const assignMutation = useAssignPatient();
  const unassignMutation = useUnassignPatient();

  // Group assigned patients by clinician user id
  const patientsByClinician = useMemo(() => {
    const map: Record<number, any[]> = {};
    patients.forEach((p: any) => {
      const cId = p.clinician?.id;
      if (cId != null) {
        if (!map[cId]) map[cId] = [];
        map[cId].push(p);
      }
    });
    return map;
  }, [patients]);

  const handleAssign = () => {
    if (!assignTarget || selectedPatientId == null) return;
    assignMutation.mutate(
      { clinicianId: assignTarget.id, patientId: selectedPatientId },
      {
        onSuccess: () => {
          toast.success("Patient assigned successfully");
          setAssignTarget(null);
          setSelectedPatientId(null);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleUnassign = (clinicianId: number, patientId: number) => {
    unassignMutation.mutate(
      { clinicianId, patientId },
      {
        onSuccess: () => toast.success("Patient unassigned"),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  if (loadingClinicians || loadingPatients) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        Loading assignments…
      </div>
    );
  }

  const totalAssigned = patients.filter((p: any) => p.clinician).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Assignments</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage which patients are assigned to each clinician.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-zinc-900">
              {clinicians.length}
            </div>
            <div className="text-zinc-500">Clinicians</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-zinc-900">{totalAssigned}</div>
            <div className="text-zinc-500">Assigned</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-zinc-900">
              {unassigned.length}
            </div>
            <div className="text-zinc-500">Unassigned</div>
          </div>
        </div>
      </div>

      {/* Clinician cards */}
      {clinicians.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No clinicians found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinicians.map((clinician: any) => {
            const assignedPatients = patientsByClinician[clinician.id] ?? [];
            return (
              <Card
                key={clinician.id}
                className="p-4 flex flex-col gap-4 shadow-none border border-zinc-200 rounded-xl"
              >
                {/* Clinician header */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                      {initials(clinician.full_name || clinician.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 truncate">
                      {clinician.full_name || clinician.username}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {clinician.specialty || "No specialty"}
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                    {assignedPatients.length}{" "}
                    {assignedPatients.length === 1 ? "patient" : "patients"}
                  </Badge>
                </div>

                {/* Patient list */}
                <div className="flex-1 divide-y divide-zinc-100 min-h-15">
                  {assignedPatients.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-400">
                      No patients assigned yet
                    </p>
                  ) : (
                    assignedPatients.map((patient: any) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between py-2 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-600">
                              {initials(patient.full_name || patient.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-zinc-800 truncate">
                            {patient.full_name || patient.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <RiskBadge risk={patient.risk_category} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                            disabled={unassignMutation.isPending}
                            onClick={() =>
                              handleUnassign(clinician.id, patient.id)
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Assign button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg"
                  onClick={() =>
                    setAssignTarget({
                      id: clinician.id,
                      name: clinician.full_name || clinician.username,
                    })
                  }
                >
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Assign Patient
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign patient modal */}
      <Dialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignTarget(null);
            setSelectedPatientId(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign patient to {assignTarget?.name}</DialogTitle>
          </DialogHeader>

          {unassigned.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              No unassigned patients available.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto -mx-1 px-1">
              {unassigned.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full flex items-center justify-between px-2 py-2.5 rounded-lg text-left transition-colors ${
                    selectedPatientId === p.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-600">
                        {initials(p.full_name || p.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {p.full_name || p.email}
                    </span>
                  </div>
                  <RiskBadge risk={p.risk_category} />
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setAssignTarget(null);
                setSelectedPatientId(null);
              }}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg"
              disabled={selectedPatientId == null || assignMutation.isPending}
              onClick={handleAssign}
            >
              {assignMutation.isPending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
