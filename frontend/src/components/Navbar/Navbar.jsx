import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <span className="text-4xl">🐼</span>

          <div>
            <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
              TaskPanda AI
            </h1>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              Productivity Platform
            </p>
          </div>
        </Link>

        {/* Navigation */}

        <div className="hidden md:flex items-center gap-8 text-slate-700 dark:text-slate-200">

          <a href="#home" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Home
          </a>

          <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Features
          </a>

          <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            About
          </a>

          <a href="#contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Contact
          </a>

        </div>

        {/* Buttons */}

        <div className="flex items-center gap-3">

          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/login"
            className="px-5 py-2 rounded-xl border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition font-medium"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
          >
            Get Started
          </Link>

        </div>

      </nav>
    </header>
  );
}

export default Navbar;