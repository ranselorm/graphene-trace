import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const user = session?.user;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="flex">
        {/* Sidebar */}
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

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="md:hidden">
                <div className="text-sm text-zinc-400">Admin Portal</div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 px-2 hover:bg-zinc-900"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-900 text-zinc-200">
                          {(user?.name ?? "A")
                            .split(" ")
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-2 hidden sm:block text-left">
                        <div className="text-sm leading-tight">
                          {user?.name ?? "Admin"}
                        </div>
                        <div className="text-xs text-zinc-400 leading-tight">
                          {user?.email ?? ""}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="bg-zinc-950 border-zinc-800 text-zinc-50"
                  >
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-zinc-900"
                      onClick={() => navigate("/admin")}
                    >
                      Overview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-300 focus:bg-zinc-900"
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
