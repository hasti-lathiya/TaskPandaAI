import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  PawPrint,
  FileText,
  User,
  Users,
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    {
      name: "Tasks",
      icon: <CheckSquare size={20} />,
      path: "/tasks",
    },
    {
      name: "AI Scheduler",
      icon: "🤖",
      path: "/ai-scheduler"
    },
    {
      name: "Internship",
      icon: <Briefcase size={20} />,
      path: "/internship",
    },
    {
      name: "Teams",
      icon: <Users size={20} />,
      path: "/teams",
    },
    {
      name: "PDF Manager",
      icon: <FileText size={20} />,
      path: "/pdf-manager",
    },
    {
      name: "Panda Pet",
      icon: <PawPrint size={20} />,
      path: "/panda",
    },
    {
      name: "Profile",
      icon: <User size={20} />,
      path: "/profile",
    },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-screen px-6 py-8 transition-colors duration-300">

      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          🐼 TaskPanda
        </h1>

        <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">
          Student Productivity Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-3">

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/80"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}

      </nav>

      {/* Bottom Card */}
      <div className="mt-16 bg-indigo-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/50 rounded-3xl p-5">

        <div className="text-4xl mb-3">
          🐼
        </div>

        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Keep Growing Your Panda
        </h3>

        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          Complete tasks and internship goals to level up.
        </p>

      </div>

    </aside>
  );
}

export default Sidebar;