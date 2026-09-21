import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../../firebase/firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

function RecentTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "tasks"),
          where("userId", "==", user.uid)
        );

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const title = (data.title || "").replace(/assigmment/g, "assignment");
              list.push({
                id: docSnap.id,
                ...data,
                title,
              });
            });
            // Sort in memory by createdAt descending
            list.sort((a, b) => {
              const valA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
              const valB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
              return valB - valA;
            });
            setTasks(list.slice(0, 5));
          },
          (err) => {
            console.error("Error loading recent tasks: ", err);
          }
        );
      } else {
        setTasks([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
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
    <div className="glass-premium rounded-[24px] p-6 shadow-sm">

      <div className="flex justify-between items-center gap-4 mb-6">

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            📝 Recent Tasks
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your latest activity and priorities
          </p>
        </div>

        <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-indigo-500/10 dark:border-indigo-500/35 shadow-sm">
          {tasks.length} Tasks
        </div>

      </div>

      {tasks.length === 0 ? (

        <div className="text-center py-12">

          <div className="text-6xl mb-4 select-none">
            📭
          </div>

          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            No recent tasks
          </h3>

          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Create your first task to start tracking progress.
          </p>

        </div>

      ) : (

        <div className="space-y-3.5">

          {tasks.map((task) => (

            <div
              key={task.id}
              className="border border-slate-200/50 dark:border-slate-800/80 rounded-[20px] p-4 transition-all duration-300 bg-white/40 dark:bg-[#070b14]/30 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-md hover:-translate-y-0.5"
            >

              <div className="flex justify-between items-start gap-4">

                <div className="flex-1">

                  <div className="flex items-center gap-2 mb-2.5">

                    <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200/10 dark:border-slate-800/20">
                      {getCategoryEmoji(task.category)} {task.category}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>

                  </div>

                  <h3
                    className={`font-bold text-base tracking-tight ${
                      task.completed
                        ? "line-through text-slate-400 dark:text-slate-600"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {task.title}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-500 mt-2 text-xs font-semibold">
                    📅 {task.dueDate || "No due date"}
                  </p>

                </div>

                <div className="text-2xl ml-4 select-none drop-shadow-sm">
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