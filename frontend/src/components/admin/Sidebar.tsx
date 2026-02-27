import { NavLink, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/auth";

function ShellNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-zinc-800 text-zinc-50"
            : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}
const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-zinc-900 min-h-screen">
      <div className="p-4">
        <div className="text-sm text-zinc-400">Portal</div>
        <div className="text-lg font-semibold leading-tight">Admin</div>
      </div>

      <Separator className="bg-zinc-900" />

      <nav className="p-3 space-y-1">
        <ShellNavLink to="/admin" label="Overview" />
        <ShellNavLink to="/admin/users" label="Users (soon)" />
        <ShellNavLink to="/admin/assignments" label="Assignments (soon)" />
        <ShellNavLink to="/admin/settings" label="Settings (soon)" />
      </nav>

      <div className="mt-auto p-3">
        <Separator className="bg-zinc-900 mb-3" />
        <Button
          variant="secondary"
          className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Log out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
