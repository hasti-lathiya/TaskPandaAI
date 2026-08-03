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
import { useTheme } from "../../context/ThemeContext";

function Sidebar() {
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
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col justify-between bg-white/70 dark:bg-[#070b14]/70 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/70 p-4 z-40 pb-6">
      
      {/* Scrollable upper section */}
      <div className="flex flex-col overflow-y-auto pr-1 scrollbar-none">
        {/* Logo */}
        <div className="mb-8 pt-4 px-2">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span>🐼</span> TaskPanda
          </h1>

          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1 tracking-wider uppercase">
            Productivity Platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 text-sm ${
                  isActive
                    ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-650 dark:text-indigo-350 font-bold border-l-2 border-indigo-500 glow-active shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 font-medium"
                }`
              }
            >
              {getMenuItemIcon(item.name)}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Companion Card */}
      <div className="mt-6 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-slate-900/40 dark:via-slate-900/30 dark:to-indigo-950/20 border border-slate-200/50 dark:border-slate-800/60 rounded-[24px] p-4.5 flex-shrink-0 flex items-center gap-3.5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="text-4xl animate-float flex-shrink-0 select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
          {getCompanionEmoji()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-[13px] mb-0.5 whitespace-normal break-words tracking-tight">
            {getCompanionLabel()}
          </h4>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Complete tasks & goals to grow
          </p>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;