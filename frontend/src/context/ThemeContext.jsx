import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const companionThemes = {
  Panda: {
    primary: "#4f46e5",
    hover: "#4338ca",
    bgLight: "#e0e7ff",
    accentLight: "#818cf8",
    secondary: "#7c3aed",
  },
  Cat: {
    primary: "#f97316",
    hover: "#ea580c",
    bgLight: "#fff7ed",
    accentLight: "#fbd5b0",
    secondary: "#f59e0b",
  },
  Dog: {
    primary: "#10b981",
    hover: "#059669",
    bgLight: "#ecfdf5",
    accentLight: "#a7f3d0",
    secondary: "#06b6d4",
  },
  Bear: {
    primary: "#854d0e", // Honey bronze / brown amber-800
    hover: "#713f12",
    bgLight: "#fef9c3", // light yellow-100
    accentLight: "#fde047",
    secondary: "#ca8a04",
  },
  Dolphin: {
    primary: "#06b6d4", // Ocean blue / cyan
    hover: "#0891b2",
    bgLight: "#ecfeff",
    accentLight: "#a5f3fc",
    secondary: "#0284c7",
  },
  Lion: {
    primary: "#ca8a04", // Royal Gold
    hover: "#a16207",
    bgLight: "#fef9c3",
    accentLight: "#fde047",
    secondary: "#dc2626", // Crimson
  },
  Tiger: {
    primary: "#ea580c", // Sunset Orange
    hover: "#c2410c",
    bgLight: "#fff7ed",
    accentLight: "#ffedd5",
    secondary: "#0f172a", // Obsidian black
  },
  Rabbit: {
    primary: "#d946ef", // Lavender pastel / fuchsia
    hover: "#c084fc",
    bgLight: "#faf5ff",
    accentLight: "#f5d0fe",
    secondary: "#db2777",
  },
  Fox: {
    primary: "#dd6b20", // Autumn Rust
    hover: "#c05621",
    bgLight: "#fffaf0",
    accentLight: "#fdd6b5",
    secondary: "#9c4221",
  },
  Squirrel: {
    primary: "#f59e0b", // Warm amber
    hover: "#d97706",
    bgLight: "#fffbeb",
    accentLight: "#fde68a",
    secondary: "#b45309",
  },
  Deer: {
    primary: "#f472b6", // Soft pink
    hover: "#ec4899",
    bgLight: "#fdf2f8",
    accentLight: "#fbcfe8",
    secondary: "#db2777",
  },
  Penguin: {
    primary: "#0ea5e9", // Cool blue
    hover: "#0284c7",
    bgLight: "#f0f9ff",
    accentLight: "#bae6fd",
    secondary: "#075985",
  },
  Koala: {
    primary: "#6b8f71", // Soft green-grey
    hover: "#557a5b",
    bgLight: "#f0f5f1",
    accentLight: "#cfe0d3",
    secondary: "#3f6b46",
  },
  Raccoon: {
    primary: "#475569", // Slate grey
    hover: "#334155",
    bgLight: "#f8fafc",
    accentLight: "#cbd5e1",
    secondary: "#1e293b",
  },
  Owl: {
    primary: "#6d28d9", // Deep purple / night
    hover: "#5b21b6",
    bgLight: "#f5f3ff",
    accentLight: "#ddd6fe",
    secondary: "#312e81",
  },
  Wolf: {
    primary: "#3b82f6", // Silver-blue
    hover: "#2563eb",
    bgLight: "#eff6ff",
    accentLight: "#bfdbfe",
    secondary: "#1e40af",
  },
  Elephant: {
    primary: "#6b7280", // Majestic grey-blue
    hover: "#4b5563",
    bgLight: "#f9fafb",
    accentLight: "#d1d5db",
    secondary: "#374151",
  },
  Otter: {
    primary: "#14b8a6", // Playful teal/aqua
    hover: "#0d9488",
    bgLight: "#f0fdfa",
    accentLight: "#99f6e4",
    secondary: "#0f766e",
  },
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [equippedCompanion, setEquippedCompanion] = useState(() => {
    return localStorage.getItem("equippedCompanion") || "Panda";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Inject companion dynamic accent colors
  useEffect(() => {
    const root = document.documentElement;
    const theme = companionThemes[equippedCompanion] || companionThemes.Panda;
    
    root.style.setProperty("--primary-accent", theme.primary);
    root.style.setProperty("--primary-hover", theme.hover);
    root.style.setProperty("--bg-accent-light", theme.bgLight);
    root.style.setProperty("--primary-accent-light", theme.accentLight);
    root.style.setProperty("--secondary-accent", theme.secondary);
    
    localStorage.setItem("equippedCompanion", equippedCompanion);
    
    // Dispatch custom event to notify Sidebar/other components
    window.dispatchEvent(new Event("companionChanged"));
  }, [equippedCompanion]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  
  const changeCompanion = (companionName) => {
    if (companionThemes[companionName]) {
      setEquippedCompanion(companionName);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        setDarkMode,
        toggleDarkMode,
        equippedCompanion,
        changeCompanion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
