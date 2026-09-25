import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useNotifications } from "../context/NotificationContext";

// Local date string helper (YYYY-MM-DD)
const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useTaskReminders() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    let intervalId = null;

    const checkDeadlines = async (userId) => {
      if (!userId) return;

      try {
        const now = new Date();
        const todayStr = getLocalDateString(now);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateString(tomorrow);

        const q = query(
          collection(db, "tasks"),
          where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);
        const tasks = [];
        snapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });

        // Filter pending tasks that have a dueDate
        const pendingTasks = tasks.filter((t) => !t.completed && Boolean(t.dueDate));

        pendingTasks.forEach((task) => {
          const taskDueDate = task.dueDate;
          const taskTitle = task.title || "Untitled Task";

          // 1. Due Today Check
          if (taskDueDate === todayStr) {
            const reminderKey = `reminded_${userId}_${todayStr}_${task.id}_today`;
            if (!localStorage.getItem(reminderKey)) {
              localStorage.setItem(reminderKey, "true");
              addNotification(
                "Task Due Today! ⏳",
                `“${taskTitle}” is scheduled for today. Keep up the momentum!`,
                "task"
              );
            }
          }
          // 2. Overdue Check
          else if (taskDueDate < todayStr) {
            const reminderKey = `reminded_${userId}_${todayStr}_${task.id}_overdue`;
            if (!localStorage.getItem(reminderKey)) {
              localStorage.setItem(reminderKey, "true");
              addNotification(
                "Task Overdue ⚠️",
                `“${taskTitle}” was due on ${taskDueDate}. Give it some attention!`,
                "task"
              );
            }
          }
          // 3. Due Tomorrow Check
          else if (taskDueDate === tomorrowStr) {
            const reminderKey = `reminded_${userId}_${todayStr}_${task.id}_tomorrow`;
            if (!localStorage.getItem(reminderKey)) {
              localStorage.setItem(reminderKey, "true");
              addNotification(
                "Upcoming Deadline 📅",
                `“${taskTitle}” is due tomorrow (${tomorrowStr}).`,
                "task"
              );
            }
          }
        });
      } catch (err) {
        console.debug("Deadline reminder check skipped:", err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Run initial check on app load
        checkDeadlines(user.uid);
        // Periodic check every 30 minutes
        intervalId = setInterval(() => {
          checkDeadlines(user.uid);
        }, 30 * 60 * 1000);
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    });

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [addNotification]);
}
