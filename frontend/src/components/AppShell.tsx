import { Icon } from "@iconify/react";
import { useLocation, useNavigate, NavLink, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/context/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Overview", to: "/admin", end: true },
    { label: "Users", to: "/admin/users" },
    { label: "Patients", to: "/admin/patients" },
    { label: "Clinicians", to: "/admin/clinicians" },
    { label: "Assignments", to: "/admin/assignments" },
    { label: "Settings", to: "/admin/settings" },
  ],
  clinician: [
    { label: "Overview", to: "/clinician", end: true },
    { label: "Patients", to: "/clinician/patients" },
    { label: "Alerts", to: "/clinician/alerts" },
  ],
  patient: [
    { label: "Dashboard", to: "/patient/dashboard", end: true },
    { label: "Reports", to: "/patient/reports" },
    { label: "Comments", to: "/patient/comments" },
  ],
};

const titleByRole: Record<Role, string> = {
  admin: "Admin",
  clinician: "Clinician",
  patient: "Patient",
};

function roleHome(role: Role) {
  if (role === "patient") return "/patient/dashboard";
  if (role === "clinician") return "/clinician";
  //   return "/admin";
  return "/clinician";
}

function roleTitle(role: Role, pathname: string) {
  const routes = navByRole[role];
  const exact = routes.find((item) => item.to === pathname);
  if (exact) return exact.label;

  const startsWith = routes.find(
    (item) => pathname.startsWith(`${item.to}/`) && item.to !== roleHome(role),
  );
  if (startsWith) return startsWith.label;

  return routes[0]?.label ?? "Overview";
}

function ShellNavLink({ to, label, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-white"
            : "text-zinc-800 hover:bg-gray-200 hover:text-zinc-950",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AppShell({ role }: { role: Role }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const user = session?.user;
  const title = roleTitle(role, location.pathname);
  const homePath = roleHome(role);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col border-r border-gray-300 bg-white">
          <div className="p-4">
            <div className="flex items-end cursor-pointer w-max">
              <Icon
                icon="logos:active-campaign-icon"
                fontSize={45}
                color="#000000"
              />
              <span className="text-zinc-800 font-bold text-sm">Graphene</span>
            </div>
          </div>

          <nav className="p-3 space-y-3">
            {navByRole[role].map((link) => (
              <ShellNavLink key={link.to} {...link} />
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-gray-300 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-black font-black">{title}</div>
                <div className="text-xs text-zinc-500 md:hidden">
                  {titleByRole[role]} portal
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 px-2 hover:bg-gray-200"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {(user?.name ?? titleByRole[role][0])
                            .split(" ")
                            .slice(0, 2)
                            .map((s: string) => s[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-2 hidden sm:block text-left">
                        <div className="text-sm leading-tight">
                          {user?.name ?? titleByRole[role]}
                        </div>
                        <div className="text-xs text-zinc-600 leading-tight">
                          {user?.email ?? ""}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="bg-gray-50 border-zinc-800"
                  >
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-300" />
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-gray-200"
                      onClick={() => navigate(homePath)}
                    >
                      Overview
                    </DropdownMenuItem>
                    {role === "admin" ? (
                      <>
                        <DropdownMenuSeparator className="bg-gray-300" />
                        <DropdownMenuItem
                          className="cursor-pointer focus:bg-gray-200"
                          onClick={() => navigate("/admin/settings")}
                        >
                          Settings
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    <DropdownMenuSeparator className="bg-gray-300" />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 focus:bg-gray-200 focus:text-red-500"
                      onClick={() => {
                        logout();
                        navigate("/login", { replace: true });
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
