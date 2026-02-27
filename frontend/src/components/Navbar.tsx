import React from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const Navbar = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const user = session?.user;
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-900 bg-white backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="md:hidden">
          <div className="text-sm text-zinc-400">Admin Portal</div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 hover:bg-zinc-900">
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
              className="bg-gray-50 border-zinc-800 text-zinc-50"
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
  );
};

export default Navbar;
