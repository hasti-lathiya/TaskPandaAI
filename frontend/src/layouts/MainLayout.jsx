import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import { useTaskReminders } from "../hooks/useTaskReminders";

function MainLayout({ children }) {
  // Activate global task reminders (Due Today, Due Tomorrow, Overdue)
  useTaskReminders();

  // Mobile drawer slide-in state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop expand/collapse state with persistent preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse/expand
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setSidebarOpen((prev) => !prev);
        } else {
          toggleCollapse();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop pinned + Mobile slide-in drawer + Expand/Collapse support) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-3.5 sm:p-6 lg:p-8 relative z-10 flex flex-col justify-start transition-all duration-300">

        {/* Top Navigation */}
        <Topbar 
          onOpenSidebar={() => setSidebarOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Page Content with smooth fade-in entry */}
        <div className="mt-0 flex-grow animate-fade-in w-full">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;