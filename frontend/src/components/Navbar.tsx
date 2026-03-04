import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import { routesConfig } from "@/routesConfig";

const Navbar = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const user = session?.user;

  const pathname = location.pathname;

  // Extract last segment or use full path
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "admin";

  const currentRoute = routesConfig.find(
    (route) => route.path === pathname || route.path === lastSegment,
  );
  const title = currentRoute?.title || "Overview";

  console.log(title);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-300 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="">
          <div className="text-sm text-black font-black">{title}</div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 hover:bg-gray-200">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {(user?.name ?? "A")
                      .split(" ")
                      .slice(0, 2)
                      .map((s: any) => s[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2 hidden sm:block text-left">
                  <div className="text-sm leading-tight">
                    {user?.name ?? "Admin"}
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
              <DropdownMenuItem
                className="cursor-pointer focus:bg-gray-200"
                onClick={() => navigate("/admin/settings")}
              >
                Account
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-300" />
              <DropdownMenuItem
                className="cursor-pointer focus:bg-gray-200"
                onClick={() => navigate("/admin")}
              >
                Overview
              </DropdownMenuItem>
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
  );
};

export default Navbar;
