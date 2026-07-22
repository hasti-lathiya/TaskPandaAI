import { auth } from "../../firebase/firebase";
import {
  Bell,
  CalendarDays,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

function Topbar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const user = auth.currentUser;

  const hour = new Date().getHours();

  let greeting;

  if (hour < 12) greeting = "Good Morning ☀️";
  else if (hour < 18) greeting = "Good Afternoon 🌤️";
  else greeting = "Good Evening 🌙";

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <header className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl px-8 py-6 flex justify-between items-center shadow-sm transition-colors duration-300">

      {/* Left Section */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {greeting}
        </h2>

        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.displayName || "Student"}
        </p>

        <div className="flex items-center gap-2 mt-3 text-gray-500 dark:text-slate-400 text-sm">
          <CalendarDays size={16} />
          {today}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition p-3 rounded-2xl cursor-pointer"
        >
          {darkMode ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}
        </button>

        {/* Notifications */}
        <button className="relative bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition p-3 rounded-2xl cursor-pointer">
          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Initial */}
        <div className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-5 py-3 rounded-2xl">
          {user?.displayName?.charAt(0)?.toUpperCase() || "S"}
        </div>

      </div>

    </header>
  );
}

export default Topbar;