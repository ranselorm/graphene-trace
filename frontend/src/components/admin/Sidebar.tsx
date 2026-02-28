import { NavLink } from "react-router-dom";

import { Icon } from "@iconify/react";

const links = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Patients", to: "/admin/patients" },
  { label: "Clinicians", to: "/admin/clinicians" },
  { label: "Assignments", to: "/admin/assignments" },
  { label: "Settings", to: "/admin/settings" },
];

function ShellNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-white"
            : "text-text-zinc-900 hover:bg-gray-200 hover:text-zinc-",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}
const Sidebar = () => {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-gray-300 min-h-screen bg-white">
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

      {/* <Separator className="bg-zinc-900" /> */}

      <nav className="p-3 space-y-3">
        {links.map((link) => (
          <ShellNavLink to={link.to} label={link.label} />
        ))}
        {/* <ShellNavLink to="/admin" label="Overview" />
        <ShellNavLink to="/admin/users" label="Users" />
        <ShellNavLink to="/admin/patients" label="Patients" />
        <ShellNavLink to="/admin/clinicians" label="Clinicians" />
        <ShellNavLink to="/admin/assignments" label="Assignments" />
        <ShellNavLink to="/admin/settings" label="Settings" /> */}
      </nav>

      {/* <div className="mt-auto mx-auto p-3">
        <Separator className="bg-gray-300 mb-3" />
        <div className="flex items-center gap-x-1">
          <Icon icon="solar:copyright-line-duotone" />
          <p className="text-xs">Graphene Trace 2026</p>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;
