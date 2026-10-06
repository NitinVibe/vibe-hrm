import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell() {
  return (
    <div className="h-screen overflow-hidden bg-transparent">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex h-screen min-w-0 flex-col pl-[210px]">
        {/* Fixed header area */}
        <Header />

        {/* Only page content scrolls */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}