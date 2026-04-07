import React from "react";

import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Patients from "./pages/admin/Patients";
import Clinicians from "./pages/admin/Clinicians";
import Assignments from "./pages/admin/Assignments";
import Settings from "./pages/admin/Settings";
import ClinicianOverview from "./pages/clinician/Overview";
import ClinicianPatients from "./pages/clinician/Patients";
import ClinicianAlerts from "./pages/clinician/Alerts";
import PatientDashboard from "./pages/patient/Dashboard";
import PatientReports from "./pages/patient/Reports";
import PatientComments from "./pages/patient/Comments";

type RouteConfig = {
  path: string;
  title: string;
  element: React.ReactElement;
};

export const adminRoutesConfig: RouteConfig[] = [
  // admin route configuration
  {
    path: "/admin",
    title: "Overview",
    element: React.createElement(Overview),
  },

  {
    path: "users",
    title: "Users",
    element: React.createElement(Users),
  },

  {
    path: "patients",
    title: "Patients",
    element: React.createElement(Patients),
  },

  {
    path: "clinicians",
    title: "Clinicians",
    element: React.createElement(Clinicians),
  },
  {
    path: "assignments",
    title: "Assignments",
    element: React.createElement(Assignments),
  },
  {
    path: "settings",
    title: "Settings",
    element: React.createElement(Settings),
  },
];

export const clinicianRoutesConfig: RouteConfig[] = [
  {
    path: "/clinician",
    title: "Overview",
    element: React.createElement(ClinicianOverview),
  },
  {
    path: "patients",
    title: "Patients",
    element: React.createElement(ClinicianPatients),
  },
  {
    path: "alerts",
    title: "Alerts",
    element: React.createElement(ClinicianAlerts),
  },
];

export const patientRoutesConfig: RouteConfig[] = [
  {
    path: "dashboard",
    title: "Dashboard",
    element: React.createElement(PatientDashboard),
  },
  {
    path: "comments",
    title: "Comments",
    element: React.createElement(PatientComments),
  },
  {
    path: "reports",
    title: "Reports",
    element: React.createElement(PatientReports),
  },
];

// Backward-compatible alias used by older components.
export const routesConfig = adminRoutesConfig;
