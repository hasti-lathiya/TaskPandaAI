import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <span className="text-3xl sm:text-4xl">🐼</span>

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
              TaskPanda AI
            </h1>

            <p className="hidden sm:block text-xs text-gray-500 dark:text-slate-400">
              Productivity Platform
            </p>
          </div>
        </Link>

        {/* Navigation */}

        <div className="hidden md:flex items-center gap-8 text-slate-700 dark:text-slate-200">

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {link.label}
            </a>
          ))}

        </div>

        {/* Buttons */}

        <div className="flex items-center gap-3">

          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/login"
            className="hidden sm:inline-block px-5 py-2 rounded-xl border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition font-medium"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="hidden sm:inline-block px-5 py-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
          >
            Get Started
          </Link>

          {/* Mobile menu toggle */}

          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>

      </nav>

      {/* Mobile menu panel */}

      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-200 dark:border-slate-800 px-5 py-4 flex flex-col gap-1 bg-white/95 dark:bg-slate-900/95"
        >

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
            >
              {link.label}
            </a>
          ))}

          <div className="flex gap-3 pt-3 sm:hidden">

            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center px-5 py-2.5 rounded-xl border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition font-medium"
            >
              Login
            </Link>

            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
            >
              Get Started
            </Link>

          </div>

        </div>
      )}

    </header>
  );
}

export default Navbar;
