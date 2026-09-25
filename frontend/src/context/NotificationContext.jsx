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
    } catch {}
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

  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const addNotification = async (title, message, type = "system") => {
    // Play sound effect
    playNotificationSound(type, isSoundEnabled());

    // Send native desktop push notification if enabled
    sendDesktopNotification(title, message);

    // Add real-time toast alert
    addToast(`${title}: ${message}`, type === "gamification" ? "success" : "info");

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
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        desktopPermission,
        requestDesktopPermission,
        playNotificationSound,
      }}
    >
      {children}
      
      {/* Toast Portal - Bottom Right Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
              t.type === "success"
                ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300"
                : t.type === "info"
                ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300"
                : "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
            }`}
          >
            <span className="text-lg">
              {t.type === "success" ? "🎉" : t.type === "info" ? "🔔" : "💡"}
            </span>
            <span className="text-sm font-bold leading-normal">{t.message}</span>
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
