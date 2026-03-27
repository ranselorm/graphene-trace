import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UnassignedPatient = {
  id: number;
  full_name: string;
  email: string;
  risk_category: string;
};

const Patients = () => {
  const { accessToken } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data: unassigned = [] } = useQuery<UnassignedPatient[]>({
    queryKey: ["patients", "unassigned"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/patients/unassigned/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return data;
    },
  });

  const hasUnassignedPatients = unassigned.length > 0;
  const canAssign = hasUnassignedPatients && !!selectedPatientId;

  const selectedPatient = useMemo(
    () =>
      unassigned.find((patient) => String(patient.id) === selectedPatientId),
    [unassigned, selectedPatientId],
  );

  return (
    <div className="container mx-auto space-y-6">
      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">
            Assign Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedPatientId}
            onValueChange={setSelectedPatientId}
            disabled={!hasUnassignedPatients}
          >
            <SelectTrigger className="w-full md:w-90">
              <SelectValue placeholder="Select unassigned patient" />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map((patient) => (
                <SelectItem key={patient.id} value={String(patient.id)}>
                  {patient.full_name} ({patient.risk_category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            disabled={!canAssign}
            onClick={() => {
              if (!selectedPatient) return;
              toast.info(
                `Selected ${selectedPatient.full_name}. Assignment action can be wired to your clinician workflow endpoint.`,
              );
            }}
          >
            Assign Patient
          </Button>

          {!hasUnassignedPatients && (
            <p className="text-sm text-zinc-500">
              No unassigned patients available right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;
