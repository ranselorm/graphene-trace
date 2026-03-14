import { Badge } from "./components/ui/badge";

export type Severity = "low" | "medium" | "high";
export type Status = "new" | "reviewed" | "resolved";

export type LatestAlert = {
  id: number;
  patientName: string;
  alertType: string;
  label: string;
  severity: Severity;
  status: Status;
  timestamp: string;

  // Optional fields, to be added when backend is ready
  clinicianName?: string;
  sensorFrameId?: number;
  notes?: string;
};

//chart and alert data
export const alertsTrend7Days = [
  { day: "Mon", alerts: 3 },
  { day: "Tue", alerts: 5 },
  { day: "Wed", alerts: 2 },
  { day: "Thu", alerts: 7 },
  { day: "Fri", alerts: 4 },
  { day: "Sat", alerts: 6 },
  { day: "Sun", alerts: 3 },
];

export const alertsTrendMonth = [
  { day: "W1", alerts: 14 },
  { day: "W2", alerts: 18 },
  { day: "W3", alerts: 8 },
  { day: "W4", alerts: 24 },
];

export const assignmentCoverage = [
  { name: "Assigned", patients: 4 },
  { name: "Unassigned", patients: 1 },
];

export const recentActivities = [
  {
    id: 1,
    type: "alert" as const,
    message: "High pressure alert triggered for Patient John Doe",
    timestamp: "2 minutes ago",
  },
  {
    id: 2,
    type: "assignment" as const,
    message: "Dr. Sarah Johnson assigned to Patient Jane Smith",
    timestamp: "15 minutes ago",
  },
  {
    id: 3,
    type: "comment" as const,
    message: "Dr. Emily Chen commented on Patient Mike Wilson’s sensor frame",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    type: "sensor_frame" as const,
    message: "New sensor frame uploaded for Patient Anna Lee",
    timestamp: "2 hours ago",
  },
  {
    id: 5,
    type: "alert" as const,
    message: "Low contact area alert triggered for Patient Robert Brown",
    timestamp: "3 hours ago",
  },
  {
    id: 6,
    type: "assignment" as const,
    message: "Patient John Doe reassigned to Dr. Mark Davis",
    timestamp: "4 hours ago",
  },
  {
    id: 7,
    type: "system" as const,
    message: "System sync completed successfully",
    timestamp: "5 hours ago",
  },
];

export const latestAlerts: LatestAlert[] = [
  {
    id: 1,
    patientName: "John Doe",
    alertType: "high_pressure",
    label: "High pressure",
    severity: "high",
    status: "new",
    timestamp: "2 mins ago",
  },
  {
    id: 2,
    patientName: "Anna Lee",
    alertType: "low_contact_area",
    label: "Low contact area",
    severity: "medium",
    status: "reviewed",
    timestamp: "25 mins ago",
  },
  {
    id: 3,
    patientName: "Mike Wilson",
    alertType: "high_pressure",
    label: "High pressure",
    severity: "high",
    status: "new",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    patientName: "Jane Smith",
    alertType: "low_contact_area",
    label: "Low contact area",
    severity: "low",
    status: "resolved",
    timestamp: "2 hours ago",
  },
];

export type RecentActivity = (typeof recentActivities)[number];

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "high") return <Badge variant="destructive">High</Badge>;
  if (severity === "medium")
    return (
      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
        Medium
      </Badge>
    );
  return <Badge variant="outline">Low</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  if (status === "new")
    return (
      <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-100">New</Badge>
    );
  if (status === "reviewed")
    return (
      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
        Reviewed
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
      Resolved
    </Badge>
  );
}

//users
export type UserRole = "admin" | "clinician" | "patient";
// export type UserStatus = "active" | "disabled";  MAIN CODE. USE THIS WHEN BACKEND RETURNS THE ACTUAL STATUS
export type UserStatus = true | false;

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdOn: string;
  lastLogin: string;
  status?: UserStatus;
  avatarUrl?: string;
};

export function initials(name?: string | null) {
  const normalizedName = (name ?? "").trim();

  if (!normalizedName) {
    return "U";
  }

  return normalizedName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export const AVATAR_VARIANTS = [
  "avataaars",
  "bottts",
  "identicon",
  "initials",
] as const;

export function dummyAvatar(
  name?: string | null,
  variant: (typeof AVATAR_VARIANTS)[number] = "initials",
) {
  const seed = encodeURIComponent((name ?? "").trim() || "user");
  return `https://api.dicebear.com/8.x/${variant}/svg?seed=${seed}`;
}

export const seedUsers: UserRow[] = [
  {
    id: 1,
    name: "Silas Blackwood",
    email: "silas.black@gmail.com",
    role: "admin",
    createdOn: "2/11/22",
    lastLogin: "5 minutes ago",
    // status: "active",
    avatarUrl: dummyAvatar("Silas Blackwood", "initials"),
  },
  {
    id: 2,
    name: "Hazel Willow",
    email: "hazel112@outlook.com",
    role: "clinician",
    createdOn: "8/2/21",
    lastLogin: "1 week ago",
    // status: "disabled",
    avatarUrl: dummyAvatar("Hazel Willow", "initials"),
  },
  {
    id: 3,
    name: "Scarlett Rose",
    email: "scarlet.rose@gmail.com",
    role: "patient",
    createdOn: "8/15/21",
    lastLogin: "3 days ago",
    // status: "active",
    avatarUrl: dummyAvatar("Scarllet Rose", "initials"),
  },
  {
    id: 4,
    name: "Juniper Skye",
    email: "juniper5@outlook.com",
    role: "clinician",
    createdOn: "5/30/25",
    lastLogin: "2 hours ago",
    // status: "active",
    avatarUrl: dummyAvatar("Juniper Skye", "initials"),
  },
  {
    id: 5,
    name: "Jemmy Henry",
    email: "j.henry333@gmail.com",
    role: "patient",
    createdOn: "5/27/23",
    lastLogin: "Yesterday",
    // status: "disabled",
    avatarUrl: dummyAvatar("Jemmy Henry", "initials"),
  },
  {
    id: 6,
    name: "Owen Locklear",
    email: "owen007@yahoo.com",
    role: "clinician",
    createdOn: "5/19/20",
    lastLogin: "30 minutes ago",
    // status: "active",
    avatarUrl: dummyAvatar("Owen Locklear", "initials"),
  },
  {
    id: 7,
    name: "Willow Sage",
    email: "willow.sage@gmail.com",
    role: "admin",
    createdOn: "8/16/22",
    lastLogin: "4 hours ago",
    // status: "active",
    avatarUrl: dummyAvatar("Willow Sage", "initials"),
  },
];
