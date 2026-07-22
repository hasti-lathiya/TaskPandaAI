import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 px-10 py-8 overflow-x-hidden">

        {/* Top Navigation */}
        <Topbar />

        {/* Page Content */}
        <div className="mt-8">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;