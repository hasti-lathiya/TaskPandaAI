import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";

import { db, auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CalendarView from "./CalendarView";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";


function Tasks() {
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
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      const taskList = [];

      querySnapshot.forEach((doc) => {
        taskList.push({
          id: doc.id,
          ...doc.data(),
        });
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

      const newXP = userData.xp + 10;
      const newCoins = userData.coins + 5;

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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            📋 Task Manager
          </h1>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Organize your daily productivity.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-md cursor-pointer"
        >
          + Add Task
        </button>
      </div>

      {/* Search & Stats */}
<div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">

  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">
    <p className="text-gray-500 dark:text-slate-400">
      📋 Total Tasks
    </p>

    <h2 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
      {tasks.length}
    </h2>
  </div>

  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">
    <p className="text-gray-500 dark:text-slate-400">
      ✅ Completed
    </p>

    <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
      {completedTasks}
    </h2>
  </div>

  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">
    <p className="text-gray-500 dark:text-slate-400">
      ⏳ Pending
    </p>

    <h2 className="text-4xl font-bold text-orange-500 dark:text-amber-400 mt-2">
      {pendingTasks}
    </h2>
  </div>

  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">
    <p className="text-gray-500 dark:text-slate-400">
      🔥 Completion Rate
    </p>

    <h2 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
      {completionRate}%
    </h2>
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
        className={`px-4 py-2 rounded-xl transition cursor-pointer ${
          selectedCategory === category
            ? "bg-indigo-600 dark:bg-indigo-500 text-white"
            : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        }`}
      >
        {category}
      </button>

    ))}

  </div>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow outline-none"
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