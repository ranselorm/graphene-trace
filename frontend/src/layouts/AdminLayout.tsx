import { Outlet } from "react-router-dom";

// shadcn/ui
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/Navbar";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-white text-zinc-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 min-w-0">
          <Navbar />

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
