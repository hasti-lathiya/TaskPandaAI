import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { playNotificationSound } from "../utils/soundEffects";
import { Sparkles, Bell, AlertCircle, X } from "lucide-react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("app_notifications");
    return saved ? JSON.parse(saved) : [
      {
        id: "welcome-notif",
        title: "Welcome to TaskPanda! 🐼",
        message: "Start adding tasks, scheduling AI workflows, and leveling up your companion!",
        createdAt: new Date().toISOString(),
        read: false,
        type: "system",
      }
    ];
  });

  const [toasts, setToasts] = useState([]);

  // Sync state to localStorage for guest/offline fallback
  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Sync from Firestore in real-time if logged in
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid)
        );

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Sort in memory by createdAt descending
            list.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });

            const slicedList = list.slice(0, 15);

            if (slicedList.length === 0) {
              slicedList.push({
                id: "welcome-notif",
                title: "Welcome to TaskPanda! 🐼",
                message: "Start adding tasks, scheduling AI workflows, and leveling up your companion!",
                createdAt: new Date().toISOString(),
                read: false,
                type: "system",
              });
            }
            setNotifications(slicedList);
          },
          (err) => {
            console.error("Firestore notifications sync error: ", err);
          }
        );
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const [desktopPermission, setDesktopPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const isSoundEnabled = () => {
    try {
      const saved = localStorage.getItem("taskpanda_sound_effects");
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignore localStorage parse errors and fallback to true
    }
    return true;
  };

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopPermission(perm);
        if (perm === "granted") {
          new Notification("Notifications Enabled! 🐼", {
            body: "You will now receive desktop alerts for deadlines and achievements.",
            icon: "/favicon.ico",
          });
        }
        return perm;
      } catch (err) {
        console.error("Desktop permission error:", err);
      }
    }
    return "unsupported";
  };

  const sendDesktopNotification = (title, message) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
        });
      } catch (e) {
        console.debug("Desktop notification suppressed:", e);
      }
    }
  };

  const addToast = (content, type = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    let title = "";
    let message = "";
    let toastType = type;

    if (typeof content === "object" && content !== null) {
      title = content.title || "";
      message = content.message || "";
      toastType = content.type || type;
    } else {
      message = String(content || "");
    }

    setToasts((prev) => [...prev, { id, title, message, type: toastType }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = async (title, message, type = "system") => {
    // Play sound effect
    playNotificationSound(type, isSoundEnabled());

    // Send native desktop push notification if enabled
    sendDesktopNotification(title, message);

    // Add real-time toast alert with separate title and message
    const toastType =
      type === "gamification"
        ? "success"
        : type === "warning" || type === "danger"
        ? "error"
        : "info";
    addToast({ title, message, type: toastType });

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await addDoc(collection(db, "notifications"), {
          title,
          message,
          type,
          read: false,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to add notification to Firestore:", err);
      }
    } else {
      // Local fallback
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).substr(2, 9),
          title,
          message,
          type,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const markAsRead = async (notifId) => {
    if (notifId === "welcome-notif") return;
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updateDoc(doc(db, "notifications", notifId), { read: true });
      } catch (err) {
        console.error("Failed to mark read in Firestore:", err);
      }
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const unreadNotifs = notifications.filter((n) => !n.read && n.id !== "welcome-notif");
        const promises = unreadNotifs.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { read: true })
        );
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to mark all read in Firestore:", err);
      }
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const clearAllNotifications = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "notifications", docSnap.id))
        );
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to clear notifications in Firestore:", err);
      }
    } else {
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addNotification,
        addToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        desktopPermission,
        requestDesktopPermission,
        playNotificationSound,
      }}
    >
      {children}
      
      {/* Toast Portal - Top Right Container */}
      <div className="fixed top-5 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto w-full p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-slate-900/10 dark:shadow-black/70 transition-all duration-300 animate-in fade-in slide-in-from-top-3"
          >
            {/* Left Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                t.type === "success"
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : t.type === "error"
                  ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
              }`}
            >
              {t.type === "success" ? (
                <Sparkles size={17} />
              ) : t.type === "error" ? (
                <AlertCircle size={17} />
              ) : (
                <Bell size={17} />
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 pr-1 pt-0.5">
              {t.title ? (
                <>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {t.title}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">
                    {t.message}
                  </p>
                </>
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                  {t.message}
                </p>
              )}
            </div>

            {/* Dismiss X button */}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
