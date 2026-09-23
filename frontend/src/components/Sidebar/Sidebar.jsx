import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  PawPrint,
  FileText,
  User,
  Users,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";

function Sidebar({ 
  isOpen = false, 
  onClose = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {}
}) {
  const { equippedCompanion } = useTheme();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Tasks",
      path: "/tasks",
    },
    {
      name: "AI Scheduler",
      path: "/ai-scheduler",
    },
    {
      name: "Internship",
      path: "/internship",
    },
    {
      name: "Teams",
      path: "/teams",
    },
    {
      name: "PDF Manager",
      path: "/pdf-manager",
    },
    {
      name: equippedCompanion === "Panda"
        ? "Panda Pet"
        : equippedCompanion === "Cat"
        ? "Cat Pet"
        : equippedCompanion === "Dog"
        ? "Dog Pet"
        : equippedCompanion === "Bear"
        ? "Bear Pet"
        : equippedCompanion === "Dolphin"
        ? "Dolphin Pet"
        : equippedCompanion === "Lion"
        ? "Lion Pet"
        : equippedCompanion === "Tiger"
        ? "Tiger Pet"
        : equippedCompanion === "Rabbit"
        ? "Rabbit Pet"
        : "Fox Pet",
      path: "/companion",
    },
    {
      name: "Profile",
      path: "/profile",
    },
  ];

  const getMenuItemIcon = (itemName) => {
    if (equippedCompanion === "Cat") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐱</span>;
        case "Tasks": return <span className="text-xl">🐾</span>;
        case "AI Scheduler": return <span className="text-xl">🐈</span>;
        case "Internship": return <span className="text-xl">🧶</span>;
        case "Teams": return <span className="text-xl">🐈‍⬛</span>;
        case "PDF Manager": return <span className="text-xl">🐟</span>;
        case "Cat Pet": return <span className="text-xl">😼</span>;
        case "Profile": return <span className="text-xl">😺</span>;
        default: return <span className="text-xl">🐾</span>;
      }
    }
    
    if (equippedCompanion === "Dog") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐶</span>;
        case "Tasks": return <span className="text-xl">🦴</span>;
        case "AI Scheduler": return <span className="text-xl">🐕</span>;
        case "Internship": return <span className="text-xl">🎾</span>;
        case "Teams": return <span className="text-xl">🐩</span>;
        case "PDF Manager": return <span className="text-xl">🐾</span>;
        case "Dog Pet": return <span className="text-xl">🐕</span>;
        case "Profile": return <span className="text-xl">🦮</span>;
        default: return <span className="text-xl">🐾</span>;
      }
    }

    if (equippedCompanion === "Bear") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐻</span>;
        case "Tasks": return <span className="text-xl">🍯</span>;
        case "AI Scheduler": return <span className="text-xl">🐻‍❄️</span>;
        case "Internship": return <span className="text-xl">🪵</span>;
        case "Teams": return <span className="text-xl">🐨</span>;
        case "PDF Manager": return <span className="text-xl">🐟</span>;
        case "Bear Pet": return <span className="text-xl">🐻</span>;
        case "Profile": return <span className="text-xl">🐾</span>;
        default: return <span className="text-xl">🐾</span>;
      }
    }

    if (equippedCompanion === "Dolphin") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐬</span>;
        case "Tasks": return <span className="text-xl">🌊</span>;
        case "AI Scheduler": return <span className="text-xl">🌐</span>;
        case "Internship": return <span className="text-xl">🏖️</span>;
        case "Teams": return <span className="text-xl">🐋</span>;
        case "PDF Manager": return <span className="text-xl">🐳</span>;
        case "Dolphin Pet": return <span className="text-xl">🐬</span>;
        case "Profile": return <span className="text-xl">🧜‍♂️</span>;
        default: return <span className="text-xl">🌊</span>;
      }
    }

    if (equippedCompanion === "Lion") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🦁</span>;
        case "Tasks": return <span className="text-xl">👑</span>;
        case "AI Scheduler": return <span className="text-xl">⚜️</span>;
        case "Internship": return <span className="text-xl">🏰</span>;
        case "Teams": return <span className="text-xl">🦏</span>;
        case "PDF Manager": return <span className="text-xl">⚔️</span>;
        case "Lion Pet": return <span className="text-xl">🦁</span>;
        case "Profile": return <span className="text-xl">🤴</span>;
        default: return <span className="text-xl">👑</span>;
      }
    }

    if (equippedCompanion === "Tiger") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐅</span>;
        case "Tasks": return <span className="text-xl">⚡</span>;
        case "AI Scheduler": return <span className="text-xl">🔥</span>;
        case "Internship": return <span className="text-xl">🌋</span>;
        case "Teams": return <span className="text-xl">🐆</span>;
        case "PDF Manager": return <span className="text-xl">⛓️</span>;
        case "Tiger Pet": return <span className="text-xl">🐅</span>;
        case "Profile": return <span className="text-xl">🥷</span>;
        default: return <span className="text-xl">⚡</span>;
      }
    }

    if (equippedCompanion === "Rabbit") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🐰</span>;
        case "Tasks": return <span className="text-xl">🥕</span>;
        case "AI Scheduler": return <span className="text-xl">🍀</span>;
        case "Internship": return <span className="text-xl">🌸</span>;
        case "Teams": return <span className="text-xl">🐹</span>;
        case "PDF Manager": return <span className="text-xl">🔮</span>;
        case "Rabbit Pet": return <span className="text-xl">🐰</span>;
        case "Profile": return <span className="text-xl">🧚‍♀️</span>;
        default: return <span className="text-xl">🥕</span>;
      }
    }

    if (equippedCompanion === "Fox") {
      switch (itemName) {
        case "Dashboard": return <span className="text-xl">🦊</span>;
        case "Tasks": return <span className="text-xl">🍂</span>;
        case "AI Scheduler": return <span className="text-xl">🍁</span>;
        case "Internship": return <span className="text-xl">⛺</span>;
        case "Teams": return <span className="text-xl">🐿️</span>;
        case "PDF Manager": return <span className="text-xl">🪶</span>;
        case "Fox Pet": return <span className="text-xl">🦊</span>;
        case "Profile": return <span className="text-xl">🏹</span>;
        default: return <span className="text-xl">🍂</span>;
      }
    }

    // Default Panda/Standard Icons
    switch (itemName) {
      case "Dashboard": return <LayoutDashboard size={20} />;
      case "Tasks": return <CheckSquare size={20} />;
      case "AI Scheduler": return <span className="text-lg">🤖</span>;
      case "Internship": return <Briefcase size={20} />;
      case "Teams": return <Users size={20} />;
      case "PDF Manager": return <FileText size={20} />;
      case "Panda Pet": return <PawPrint size={20} />;
      case "Profile": return <User size={20} />;
      default: return <PawPrint size={20} />;
    }
  };

  const getCompanionLabel = () => {
    switch (equippedCompanion) {
      case "Cat": return "Keep Growing Your Cat";
      case "Dog": return "Keep Growing Your Dog";
      case "Bear": return "Keep Growing Your Bear";
      case "Dolphin": return "Keep Growing Your Dolphin";
      case "Lion": return "Keep Growing Your Lion";
      case "Tiger": return "Keep Growing Your Tiger";
      case "Rabbit": return "Keep Growing Your Rabbit";
      case "Fox": return "Keep Growing Your Fox";
      default: return "Keep Growing Your Panda";
    }
  };

  const getCompanionEmoji = () => {
    switch (equippedCompanion) {
      case "Cat": return "🐱";
      case "Dog": return "🐶";
      case "Bear": return "🐻";
      case "Dolphin": return "🐬";
      case "Lion": return "🦁";
      case "Tiger": return "🐅";
      case "Rabbit": return "🐰";
      case "Fox": return "🦊";
      default: return "🐼";
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 lg:static lg:h-screen flex flex-col justify-between bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800 p-3 sm:p-4 pb-6 transition-all duration-300 ease-in-out flex-shrink-0 shadow-[1px_0_3px_0_rgba(0,0,0,0.02)] ${
        isCollapsed ? "lg:w-20 w-72 max-w-[85vw]" : "lg:w-64 w-72 max-w-[85vw]"
      } ${
        isOpen ? "translate-x-0 shadow-2xl shadow-black/40" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      
      {/* Scrollable upper section */}
      <div className="flex flex-col overflow-y-auto pr-0.5 scrollbar-none flex-1">
        
        {/* Header - Expanded state */}
        {!isCollapsed && (
          <div className="mb-6 pt-2 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl sm:text-3xl flex-shrink-0 select-none">🐼</span>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  TaskPanda
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10.5px] font-bold tracking-wider uppercase whitespace-nowrap">
                  Productivity Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {/* Desktop Collapse Button */}
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
                className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <PanelLeftClose size={18} />
              </button>

              {/* Mobile Collapse/Close Button */}
              <button
                onClick={onClose}
                title="Collapse menu"
                aria-label="Collapse menu"
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer text-xs font-bold"
              >
                <ChevronLeft size={16} />
                <span>Collapse</span>
              </button>
            </div>
          </div>
        )}

        {/* Header - Collapsed state (Desktop only) */}
        {isCollapsed && (
          <div className="mb-6 pt-2 flex flex-col items-center gap-3">
            <span 
              className="text-3xl select-none hover:scale-110 transition-transform duration-200 cursor-pointer" 
              title="TaskPanda AI"
            >
              🐼
            </span>
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-150 text-sm ${
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? isCollapsed
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/40 font-bold shadow-xs"
                      : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border-l-4 border-indigo-600 dark:border-indigo-500 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold"
                }`
              }
            >
              <span className="flex-shrink-0">{getMenuItemIcon(item.name)}</span>
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          data-testid="logout-btn"
          title={isCollapsed ? "Logout" : undefined}
          onClick={async () => {
            onClose();
            await signOut(auth);
            localStorage.removeItem("app_user");
            localStorage.removeItem("app_tasks");
            localStorage.removeItem("app_coins");
            localStorage.removeItem("app_streak");
            localStorage.removeItem("app_xp");
            localStorage.removeItem("app_study_hours");
            window.location.href = "/login";
          }}
          className={`flex items-center rounded-xl transition-all duration-150 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer mt-3 ${
            isCollapsed
              ? "justify-center p-2.5"
              : "gap-3 px-3 py-2.5"
          }`}
        >
          <LogOut size={20} className="text-red-500 dark:text-red-400 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Bottom Companion Card - Expanded */}
      {!isCollapsed && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex-shrink-0 flex items-center gap-3 relative overflow-hidden shadow-xs">
          <div className="text-3xl animate-float flex-shrink-0 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
            {getCompanionEmoji()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug">
              {getCompanionLabel()}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              Grow with tasks & goals
            </p>
          </div>
        </div>
      )}

      {/* Bottom Companion Card - Collapsed */}
      {isCollapsed && (
        <div 
          title={`${getCompanionLabel()} - Active Companion`}
          className="mt-4 mx-auto w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-2xl flex-shrink-0 cursor-pointer hover:scale-105 transition-transform select-none shadow-xs"
        >
          {getCompanionEmoji()}
        </div>
      )}

    </aside>
  );
}

export default Sidebar;