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
