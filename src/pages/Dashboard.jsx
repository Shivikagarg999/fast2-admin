import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white shadow z-40">
          <Header />
        </header>

        <main className="pt-20 px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;