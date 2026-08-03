import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";

import { db, auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CalendarView from "./CalendarView";
import { useNotifications } from "../../context/NotificationContext";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";


function Tasks() {
  const { addNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const completedTasks = tasks.filter(
  (task) => task.completed
).length;

const pendingTasks = tasks.filter(
  (task) => !task.completed
).length;

const completionRate =
  tasks.length === 0
    ? 0
    : Math.round(
        (completedTasks / tasks.length) * 100
      );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("created");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Load Tasks
  const loadTasks = async () => {
    try {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);

      const taskList = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let title = data.title || "";
        if (title.includes("assigmment")) {
          const correctedTitle = title.replace("assigmment", "assignment");
          updateDoc(doc(db, "tasks", docSnap.id), { title: correctedTitle })
            .catch(err => console.error("Error correcting typo:", err));
          title = correctedTitle;
        }
        taskList.push({
          id: docSnap.id,
          ...data,
          title,
        });
      });

      // Sort in-memory to avoid Firestore composite index requirement
      taskList.sort((a, b) => {
        const valA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
        const valB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
        return valB - valA;
      });

      setTasks(taskList);
    } catch (error) {
      console.log(error);
    }
  };

  // Complete Task
  const completeTask = async (id) => {
  try {
    const taskRef = doc(db, "tasks", id);

    // Get current task
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) return;

    const taskData = taskSnap.data();

    // Already completed? Stop here.
    if (taskData.completed) {
      alert("✅ This task is already completed!");
      return;
    }

    // Mark task as completed
    await updateDoc(taskRef, {
      completed: true,
    });

    await addNotification("Task Completed! 🏆", `Task Completed: ${taskData.title}. Earned +50 Coins 🪙`, "gamification");

    // Update user XP
    const userRef = doc(db, "users", auth.currentUser.uid);

    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      const today = new Date().toISOString().split("T")[0];

      const lastCompletedDate = userData.lastCompletedDate || "";

      let newStreak = userData.streak;

      if (lastCompletedDate !== today) {

      if (lastCompletedDate === "") {
      newStreak = 1;
      } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayString = yesterday.toISOString().split("T")[0];

      if (lastCompletedDate === yesterdayString) {
      newStreak = userData.streak + 1;
      } else {
      newStreak = 1;
      }
    }

}

      const newXP = userData.xp + 1000;
      const newCoins = userData.coins + 10000;

      await updateDoc(userRef, {
      xp: newXP,
      coins: newCoins,
      level: Math.floor(newXP / 100) + 1,

      streak: newStreak,
      lastCompletedDate: today,
    });
    }

    loadTasks();

  } catch (error) {
    console.log(error);
  }
};

  const deleteTask = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this task?"
  );

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "tasks", id));

    loadTasks();
  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      loadTasks();
    }
  });

  return () => unsubscribe();
}, []);

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
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
        >
          + Add Task
        </button>
      </div>

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
          <div className="mt-5 h-1 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
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
          <div className="mt-5 h-1 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
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
          <div className="mt-5 h-1 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
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
              <h2 className="text-4xl font-extrabold text-purple-650 dark:text-purple-400 mt-3">
                {completionRate}%
              </h2>
            </div>
          </div>
          <div className="mt-5 h-1 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

<div className="mb-6">

  <input
    type="text"
    placeholder="🔍 Search tasks..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-2xl p-4 shadow border border-gray-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
  />

</div>

{/* Category Filter */}

<div className="flex justify-between items-center mb-6 flex-wrap gap-4">

  <div className="flex gap-3 flex-wrap">

    {["All", "College", "Internship", "Personal", "Other"].map((category) => (

      <button
        key={category}
        onClick={() => setSelectedCategory(category)}
        className={`px-4 py-2.5 rounded-xl transition cursor-pointer text-sm font-bold border ${
          selectedCategory === category
            ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-655 dark:text-indigo-400 shadow-sm shadow-indigo-500/10 glow-active"
            : "bg-white/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        {category}
      </button>

    ))}

  </div>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="bg-white/40 dark:bg-slate-900/60 text-slate-805 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm outline-none text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
  >
    <option value="created">Newest First</option>
    <option value="dueDate">Due Date</option>
    <option value="highPriority">High Priority First</option>
    <option value="lowPriority">Low Priority First</option>
  </select>

</div>
{/* Tasks */}

<div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              No Tasks Yet 📭
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Click "Add Task" to create your first task.
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

      {tasks
        .filter((task) => !task.completed)
        .filter((task) =>
          task.title.toLowerCase().includes(search.toLowerCase())
        )
        .filter((task) =>
          selectedCategory === "All"
            ? true
            : task.category === selectedCategory
        )
        .sort((a, b) => {

          if (sortBy === "dueDate") {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }

          if (sortBy === "highPriority") {
            const priorityOrder = {
              High: 1,
              Medium: 2,
              Low: 3,
            };

            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }

          if (sortBy === "lowPriority") {
            const priorityOrder = {
              High: 3,
              Medium: 2,
              Low: 1,
            };

            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }

          if (sortBy === "created") {
          return (
          b.createdAt?.seconds || 0
          ) - (
          a.createdAt?.seconds || 0
          );
          }

          return 0;
        })
        .map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={completeTask}
            onDelete={deleteTask}
            onEdit={(task) => {
              setSelectedTask(task);
              setEditOpen(true);
            }}
          />
        ))}

    </div>

  </div>

  {/* Completed Tasks */}

<div>

  <h2 className="text-2xl font-bold mb-4 text-green-600">
    ✅ Completed Tasks
  </h2>

  <div className="space-y-6">

    {tasks
      .filter((task) => task.completed)
      .filter((task) =>
        task.title
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .filter((task) =>
        selectedCategory === "All"
          ? true
          : task.category === selectedCategory
      )
      .sort((a, b) => {

        if (sortBy === "dueDate") {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }

        if (sortBy === "highPriority") {
          const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3,
          };

          return (
            priorityOrder[a.priority] -
            priorityOrder[b.priority]
          );
        }

        if (sortBy === "lowPriority") {
          const priorityOrder = {
            High: 3,
            Medium: 2,
            Low: 1,
          };

          return (
            priorityOrder[a.priority] -
            priorityOrder[b.priority]
          );
        }

        return 0;
      })
      .map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={(task) => {
            setSelectedTask(task);
            setEditOpen(true);
          }}
        />
      ))}

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
      <EditTaskModal
      isOpen={editOpen}
      onClose={() => {
      setEditOpen(false);
      loadTasks();
      }}
      task={selectedTask}
      />
      <CalendarView tasks={tasks} />
    </MainLayout>
  );
}

export default Tasks;