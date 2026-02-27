import React from "react";

import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Patients from "./pages/admin/Patients";
import Clinicians from "./pages/admin/Clinicians";
import Assignments from "./pages/admin/Assignments";
import Settings from "./pages/admin/Settings";

export const routesConfig = [
  //admin route configuration
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
    element: React.createElement(Users),
  },

  {
    path: "clinicians",
    title: "Clinicians",
    element: React.createElement(Users),
  },
  {
    path: "assignments",
    title: "Assignments",
    element: React.createElement(Users),
  },
  {
    path: "settings",
    title: "Settings",
    element: React.createElement(Settings),
  },
];
