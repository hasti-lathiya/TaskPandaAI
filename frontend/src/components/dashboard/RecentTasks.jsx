import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../../firebase/firebase";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

function RecentTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "tasks"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const snapshot = await getDocs(q);

        const list = [];

        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setTasks(list);
      } catch (err) {
        console.log(err);
      }
    });

    return () => unsubscribe();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50";

      case "Medium":
        return "bg-yellow-50 dark:bg-amber-950/60 text-yellow-700 dark:text-amber-400 border-yellow-100 dark:border-amber-800/50";

      case "Low":
        return "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50";

      default:
        return "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700";
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case "College":
        return "🎓";

      case "Internship":
        return "💼";

      case "Personal":
        return "🏠";

      default:
        return "📦";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 transition-colors duration-300">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            📝 Recent Tasks
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Your latest activity and priorities
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300">
          {tasks.length} Tasks
        </div>

      </div>

      {tasks.length === 0 ? (

        <div className="text-center py-12">

          <div className="text-6xl mb-4">
            📭
          </div>

          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            No recent tasks
          </h3>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Create your first task to start tracking progress.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {tasks.map((task) => (

            <div
              key={task.id}
              className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-300 bg-white dark:bg-slate-900/60"
            >

              <div className="flex justify-between items-start">

                <div className="flex-1">

                  <div className="flex items-center gap-2 mb-3">

                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                      {getCategoryEmoji(task.category)} {task.category}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>

                  </div>

                  <h3
                    className={`font-bold text-lg ${
                      task.completed
                        ? "line-through text-gray-400 dark:text-slate-500"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {task.title}
                  </h3>

                  <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
                    📅 {task.dueDate || "No due date"}
                  </p>

                </div>

                <div className="text-3xl ml-4">
                  {task.completed ? "✅" : "⏳"}
                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default RecentTasks;