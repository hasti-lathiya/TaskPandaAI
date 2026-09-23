import { useEffect, useState, useRef } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Bell,
  CalendarDays,
  Moon,
  Sun,
  CheckCheck,
  Trash2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useApp } from "../../context/AppContext";

function Topbar({ 
  onOpenSidebar = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {}
}) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user: appContextUser } = useApp();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  const [user, setUser] = useState(auth.currentUser);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  const handleMarkAsRead = (notifId) => {
    markAsRead(notifId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const compactDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task":
        return "🎯";
      case "gamification":
        return "🪙";
      case "companion":
        return "🐾";
      default:
        return "🔔";
    }
  };

  return (
    <header className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between w-full shadow-sm transition-colors duration-300 mb-6">
      {/* Left Section - Hamburger / Collapse Toggle & Date Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Drawer Open Button */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex-shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold">
          <CalendarDays size={16} className="text-indigo-500 flex-shrink-0" />
          <span className="hidden sm:inline">{today}</span>
          <span className="sm:hidden">{compactDate}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition rounded-xl sm:rounded-2xl cursor-pointer"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Bell Icon Wrapper */}
        <div ref={dropdownRef} className="relative">
          {/* Bell Button */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-200 ${
              notificationsOpen ? "bg-gray-100 dark:bg-slate-800 ring-2 ring-indigo-500" : ""
            }`}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Dropdown Panel */}
          {notificationsOpen && (
            <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-3 sm:w-96 max-w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 text-white animate-in fade-in slide-in-from-top-3 duration-200">
              
              {/* Header Row */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-slate-100">Notifications</h3>
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition text-lg leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Notification feed / list */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-3 select-none">✨</div>
                  <p className="text-sm font-bold text-slate-100">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                    You have no unread notifications right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin text-left">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition border border-slate-700/40 cursor-pointer"
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="text-lg select-none flex-shrink-0 mt-0.5">
                          {getNotificationIcon(n.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`text-sm font-medium truncate ${
                              n.read ? "text-slate-400 font-medium" : "text-slate-100 font-bold"
                            }`}>
                              {n.title}
                            </h4>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-indigo-400 mt-2 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions footer */}
              {notifications.length > 0 && notifications[0].id !== "welcome-notif" && (
                <div className="flex justify-between gap-3 pt-3 border-t border-slate-700/60 text-xs">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                  <button
                    onClick={handleClearAllNotifications}
                    className="flex items-center gap-1 text-red-400 hover:underline font-bold cursor-pointer"
                  >
                    <Trash2 size={14} /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Initial */}
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center select-none border border-indigo-200/10 dark:border-indigo-900/30 shadow-inner text-xs sm:text-base">
          {(appContextUser?.fullName || user?.displayName || "S").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

export default Topbar;