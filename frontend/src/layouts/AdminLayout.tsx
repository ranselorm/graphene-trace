import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/authContext";

// shadcn/ui
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function AdminLayout() {
  // const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
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
                          {(session?.name ?? "A")
                            .split(" ")
                            .slice(0, 2)
                            .map((s: any) => s[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-2 hidden sm:block text-left">
                        <div className="text-sm leading-tight">
                          {session?.name ?? "Admin"}
                        </div>
                        <div className="text-xs text-zinc-400 leading-tight">
                          {session?.email ?? ""}
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
          </header> */}
          <Navbar />

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
