import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";

function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 transition-colors duration-500 relative overflow-hidden">

      {/* Premium Glow Blobs Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft spotlight glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.03),transparent_40%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.06),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.02),transparent_40%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.04),transparent_40%)]" />

        {/* Slow moving animated gradient blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-purple-500/10 dark:bg-purple-600/4 blur-[140px] animate-blob animation-delay-2000" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 relative z-10 flex flex-col justify-start">

        {/* Top Navigation */}
        <Topbar />

        {/* Page Content with smooth fade-in entry */}
        <div className="mt-0 flex-grow animate-fade-in">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;