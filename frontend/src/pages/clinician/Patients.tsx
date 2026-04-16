import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/authContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PatientDetailSheet,
  type ClinicianPatient,
} from "@/components/clinician/PatientDetailSheet";

type AssignedPatient = {
  id: number;
  full_name: string;
  email: string;
  risk_category: string;
};

type ClinicianDetails = {
  id: number;
  full_name: string;
  email: string;
  specialty: string;
  assigned_patients: AssignedPatient[];
  assigned_patients_count: number;
};

function riskBadge(risk: string) {
  if (risk === "high") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
        High
      </Badge>
    );
  }
  if (risk === "medium") {
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

const Patients = () => {
  const { accessToken, session } = useAuth();
  const clinicianId = session?.user?.id as number | undefined;
  const [riskFilter, setRiskFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [selectedPatient, setSelectedPatient] =
    useState<ClinicianPatient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    data: clinicianDetails,
    isLoading,
    error,
  } = useQuery<ClinicianDetails>({
    queryKey: ["clinician", "details", clinicianId],
    enabled: !!accessToken && !!clinicianId,
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/clinicians/${clinicianId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return data;
    },
  });

  const assignedPatients = clinicianDetails?.assigned_patients ?? [];

  const filteredPatients = useMemo(() => {
    if (riskFilter === "all") return assignedPatients;
    return assignedPatients.filter(
      (patient) => patient.risk_category === riskFilter,
    );
  }, [assignedPatients, riskFilter]);

  const counts = useMemo(() => {
    return {
      total: assignedPatients.length,
      high: assignedPatients.filter(
        (patient) => patient.risk_category === "high",
      ).length,
      medium: assignedPatients.filter(
        (patient) => patient.risk_category === "medium",
      ).length,
      low: assignedPatients.filter((patient) => patient.risk_category === "low")
        .length,
    };
  }, [assignedPatients]);

  const handlePatientClick = (patient: AssignedPatient) => {
    setSelectedPatient(patient);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">My Patients</CardTitle>
          <p className="text-sm text-zinc-600">
            View patients currently assigned to your account.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-zinc-500">
              Loading assigned patients...
            </p>
          ) : error ? (
            <p className="text-sm text-rose-600">
              Unable to load clinician patients right now.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">Total Assigned</p>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {counts.total}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">High Risk</p>
                  <p className="text-2xl font-semibold text-rose-700">
                    {counts.high}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">Medium Risk</p>
                  <p className="text-2xl font-semibold text-amber-700">
                    {counts.medium}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">Low Risk</p>
                  <p className="text-2xl font-semibold text-emerald-700">
                    {counts.low}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  {clinicianDetails?.full_name} (
                  {clinicianDetails?.specialty || "No specialty"})
                </p>
                <Select
                  value={riskFilter}
                  onValueChange={(value) =>
                    setRiskFilter(value as "all" | "high" | "medium" | "low")
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Risk Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredPatients.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No assigned patients for this risk filter.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePatientClick(patient)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handlePatientClick(patient);
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {patient.full_name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {patient.email}
                        </p>
                      </div>
                      {riskBadge(patient.risk_category)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDetailSheet
        patient={selectedPatient}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default Patients;
