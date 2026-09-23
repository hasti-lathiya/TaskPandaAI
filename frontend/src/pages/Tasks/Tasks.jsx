import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import MainLayout from "../../layouts/MainLayout";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";
import CustomSelect from "../../components/Common/CustomSelect";

import { db, auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CalendarView from "./CalendarView";
import { useNotifications } from "../../context/NotificationContext";
import { awardXpOnce } from "../../services/rewards";
import { repairCost } from "../../services/streakRepair";
import { runAchievementChecks } from "../../services/achievements";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { sortTasks, filterTasks } from "../../utils/taskSorting";

const CATEGORIES = ["All", "College", "Internship", "Personal", "Other"];

function Tasks() {
  const { addNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingTasks, setCompletingTasks] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("created");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  const visibleTasks = useMemo(
    () => filterTasks(tasks, search, selectedCategory),
    [tasks, search, selectedCategory]
  );

  const pendingList = useMemo(
    () => sortTasks(visibleTasks.filter((task) => !task.completed), sortBy),
    [visibleTasks, sortBy]
  );

  const completedList = useMemo(
    () => sortTasks(visibleTasks.filter((task) => task.completed), sortBy),
    [visibleTasks, sortBy]
  );

  // Load Tasks
  const loadTasks = async () => {
    try {
      if (!auth.currentUser) return;

      setError("");

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);

      const taskList = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const title = (data.title || "").replace(/assigmment/g, "assignment");
        taskList.push({
          id: docSnap.id,
          ...data,
          title,
        });
      });

      setTasks(taskList);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Could not load your tasks. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Complete Task
  const completeTask = async (id) => {
    if (completingTasks[id]) return;
    setCompletingTasks((prev) => ({ ...prev, [id]: true }));

    try {
      const userId = auth.currentUser.uid;
      const taskRef = doc(db, "tasks", id);
      const userRef = doc(db, "users", userId);

      // Captured inside the transaction so we can act on them afterward
      // (weekly-streak bonus + achievement checks need to run outside
      // the transaction, since they perform their own separate writes).
      let earnedXP = 0;
      let newStreak = null;
      let isEarly = false;
      let brokenStreak = null;

      await runTransaction(db, async (transaction) => {
        const taskSnap = await transaction.get(taskRef);
        if (!taskSnap.exists()) {
          throw new Error("Task does not exist!");
        }

        const taskData = taskSnap.data();
        if (taskData.completed) {
          throw new Error("ALREADY_COMPLETED");
        }

        // Fetch user data before any updates (reads must precede writes)
        const userSnap = await transaction.get(userRef);

        // Mark task as completed. completedAt is what lets other pages ask
        // "was this finished today?" — without it, only "ever" is knowable.
        transaction.update(taskRef, {
          completed: true,
          completedAt: serverTimestamp(),
        });
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const today = new Date().toISOString().split("T")[0];
          const lastCompletedDate = userData.lastCompletedDate || "";
          let streak = userData.streak;
          // Set when this completion is what breaks a streak, so the old value
          // survives the reset and stays buyable back (see services/streakRepair).
          let lapsed = null;

          if (lastCompletedDate !== today) {
            if (lastCompletedDate === "") {
              streak = 1;
            } else {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayString = yesterday.toISOString().split("T")[0];

              if (lastCompletedDate === yesterdayString) {
                streak = userData.streak + 1;
              } else {
                if (userData.streak > 0) {
                  lapsed = { streak: userData.streak, date: lastCompletedDate };
                }
                streak = 1;
              }
            }
          }
          newStreak = streak;
          brokenStreak = lapsed;

          // Reward spec: normal completion +10 XP, plus an additional
          // +20 XP if completed strictly before the task's due date.
          isEarly = !!taskData.dueDate && today < taskData.dueDate;
          earnedXP = 10 + (isEarly ? 20 : 0);

          const newXP = userData.xp + earnedXP;
          // Coins are intentionally left as existing behavior (+50) —
          // the reward spec only redefines XP for task completion.
          const newCoins = userData.coins + 50;

          transaction.update(userRef, {
            xp: newXP,
            coins: newCoins,
            level: Math.floor(newXP / 100) + 1,
            streak: streak,
            lastCompletedDate: today,
            ...(lapsed
              ? { brokenStreak: lapsed.streak, brokenStreakDate: lapsed.date }
              : {}),
          });
        }
      });

      // Weekly streak bonus: +50 XP each time the streak reaches a new
      // 7-day multiple (7, 14, 21, ...). awardXpOnce's own Firestore
      // transaction guarantees this can never double-fire for the same
      // streak milestone, even across refreshes or concurrent calls.
      if (newStreak !== null && newStreak > 0 && newStreak % 7 === 0) {
        const { awarded } = await awardXpOnce(userId, {
          xp: 50,
          reason: "Weekly streak bonus",
          uniqueRewardId: `weekly-streak-${newStreak}`,
        });
        if (awarded) {
          await addNotification("Weekly Streak Bonus! 🔥", `${newStreak}-day streak reached. Earned +50 XP`, "gamification");
        }
      }

      // Surface the break here rather than leaving the user to discover it on
      // the Dashboard — the repair offer expires, so it's time-sensitive.
      if (brokenStreak) {
        await addNotification(
          "Streak Broken 💔",
          `Your ${brokenStreak.streak}-day streak ended. Restore it for ${repairCost(brokenStreak.streak)} coins from the Dashboard.`,
          "gamification"
        );
      }

      const taskObj = tasks.find(t => t.id === id);
      const bonusText = isEarly ? " (includes +20 early bonus)" : "";
      await addNotification("Task Completed! 🏆", `Task Completed: ${taskObj ? taskObj.title : "Task"}. Earned +${earnedXP} XP${bonusText}`, "gamification");

      runAchievementChecks(userId, { addNotification }).catch((err) =>
        console.error("Achievement check failed:", err)
      );

      loadTasks();

    } catch (err) {
      if (err.message === "ALREADY_COMPLETED") {
        setError("That task is already completed.");
        loadTasks();
      } else {
        console.error("Error completing task:", err);
        setError("Could not complete that task. Please try again.");
      }
    } finally {
      setCompletingTasks((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskPendingDelete || deleting) return;

    setDeleting(true);

    try {
      await deleteDoc(doc(db, "tasks", taskPendingDelete.id));
      setTaskPendingDelete(null);
      loadTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Could not delete that task. Please try again.");
      setTaskPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadTasks();
      } else {
        setTasks([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderTaskList = (list) =>
    list.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onComplete={completeTask}
        onDelete={() => setTaskPendingDelete(task)}
        onEdit={(selected) => {
          setSelectedTask(selected);
          setEditOpen(true);
        }}
      />
    ));

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            📋 Task Manager
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Organize and track your daily productivity.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
        >
          + Add Task
        </button>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 font-bold text-sm text-center shadow-sm"
        >
          {error}
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                📋 Total Tasks
              </p>
              <h2 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-3">
                {tasks.length}
              </h2>
            </div>
          </div>
          <div className="mt-5 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full w-full" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                ✅ Completed
              </p>
              <h2 className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-3">
                {completedTasks}
              </h2>
            </div>
          </div>
          <div className="mt-5 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                ⏳ Pending
              </p>
              <h2 className="text-4xl font-extrabold text-orange-500 dark:text-orange-400 mt-3">
                {pendingTasks}
              </h2>
            </div>
          </div>
          <div className="mt-5 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (pendingTasks / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                🔥 Completion Rate
              </p>
              <h2 className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mt-3">
                {completionRate}%
              </h2>
            </div>
          </div>
          <div className="mt-5 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="task-search" className="sr-only">
          Search tasks
        </label>

        <input
          id="task-search"
          type="search"
          placeholder="🔍 Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-2xl p-4 shadow border border-gray-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category Filter */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

        <div className="flex gap-3 flex-wrap">

          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`px-4 py-2.5 rounded-xl transition cursor-pointer text-sm font-bold border ${
                selectedCategory === category
                  ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10 glow-active"
                  : "bg-white/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {category}
            </button>
          ))}

        </div>

        <div>
          <CustomSelect
            id="task-sort"
            ariaLabel="Sort tasks by"
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: "created", label: "Newest First" },
              { value: "dueDate", label: "Due Date" },
              { value: "highPriority", label: "High Priority First" },
              { value: "lowPriority", label: "Low Priority First" },
            ]}
            className="min-w-[180px]"
            buttonClassName="!bg-white/40 dark:!bg-slate-900/60 !border-slate-200 dark:!border-slate-800 !rounded-xl !px-4 !py-2.5 !text-sm !font-bold hover:!bg-slate-100 dark:hover:!bg-slate-800"
          />
        </div>

      </div>

      {/* Tasks */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading your tasks…</span>
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="h-32 bg-gray-200 dark:bg-slate-800 rounded-3xl"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              No Tasks Yet 📭
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Click "Add Task" to create your first task.
            </p>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              No Matching Tasks 🔍
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Try a different search term or category.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Pending Tasks */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                📌 Pending Tasks
              </h2>

              <div className="space-y-6">
                {pendingList.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">
                    Nothing pending here.
                  </p>
                ) : (
                  renderTaskList(pendingList)
                )}
              </div>
            </div>

            {/* Completed Tasks */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
                ✅ Completed Tasks
              </h2>

              <div className="space-y-6">
                {completedList.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">
                    Nothing completed yet.
                  </p>
                ) : (
                  renderTaskList(completedList)
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          loadTasks();
        }}
      />

      {editOpen && selectedTask && (
        <EditTaskModal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedTask(null);
            loadTasks();
          }}
          task={selectedTask}
        />
      )}

      {/* Delete confirmation */}
      {taskPendingDelete &&
        createPortal(
          <div
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
          >
            <div
              className="absolute inset-0"
              onClick={() => !deleting && setTaskPendingDelete(null)}
            />

            <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10">

              <h2
                id="delete-task-title"
                className="text-2xl font-bold text-slate-800 dark:text-slate-100"
              >
                Delete this task?
              </h2>

              <p className="text-gray-500 dark:text-slate-400 mt-3">
                “{taskPendingDelete.title || "Untitled task"}” will be permanently
                removed. This can't be undone.
              </p>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setTaskPendingDelete(null)}
                  disabled={deleting}
                  className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDeleteTask}
                  disabled={deleting}
                  aria-busy={deleting}
                  className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

      <CalendarView tasks={tasks} />
    </MainLayout>
  );
}

export default Tasks;
