import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import type { Role } from "../lib/auth";
import { useAuth } from "../lib/auth";

import { LoginPage } from "../pages/Login";

// Layouts (we’ll create these next)
import { PatientLayout } from "../layouts/PatientLayout";
import { ClinicianLayout } from "../layouts/ClinicianLayout";
import { AdminLayout } from "../layouts/AdminLayout";

// Placeholder screens for now (we’ll replace with real pages later)
const PatientDashboard = () => (
  <div className="p-6">Patient Dashboard (placeholder)</div>
);
const ClinicianHome = () => (
  <div className="p-6">Clinician Home (placeholder)</div>
);
const AdminHome = () => <div className="p-6">Admin Home (placeholder)</div>;

function roleHome(role: Role) {
  switch (role) {
    case "patient":
      return "/patient/dashboard";
    case "clinician":
      return "/clinician";
    case "admin":
      return "/admin";
    default:
      return "/login";
  }
}

/**
 * Requires the user to be logged in.
 * If not logged in, sends them to /login and remembers where they tried to go.
 */
function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Requires a specific role (or one of many roles).
 * Assumes RequireAuth already ran.
 */
function RequireRole({ allow }: { allow: Role[] }) {
  const { session } = useAuth();
  const location = useLocation();

  const role = session?.user.role;
  if (!role) return <Navigate to="/login" replace />;

  if (!allow.includes(role)) {
    // If someone tries to access the wrong portal, just bounce them to their own home.
    return (
      <Navigate
        to={roleHome(role)}
        replace
        state={{ blockedFrom: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

/**
 * Default landing. If logged in, send them to their portal.
 * If not logged in, send to /login.
 */
function IndexRedirect() {
  const { session, isAuthenticated } = useAuth();

  if (!isAuthenticated || !session) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(session.user.role)} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Everything else requires auth */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<IndexRedirect />} />

        {/* Patient portal */}
        <Route element={<RequireRole allow={["patient"]} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route
              index
              element={<Navigate to="/patient/dashboard" replace />}
            />
            <Route path="dashboard" element={<PatientDashboard />} />
          </Route>
        </Route>

        {/* Clinician portal */}
        <Route element={<RequireRole allow={["clinician"]} />}>
          <Route path="/clinician" element={<ClinicianLayout />}>
            <Route index element={<ClinicianHome />} />
          </Route>
        </Route>

        {/* Admin portal */}
        <Route element={<RequireRole allow={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
