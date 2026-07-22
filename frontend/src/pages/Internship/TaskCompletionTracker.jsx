import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function TaskCompletionTracker() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  const loadTaskStats = async () => {
    try {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      let total = 0;
      let completed = 0;

      snapshot.forEach((doc) => {
        total++;

        if (doc.data().completed) {
          completed++;
        }
      });

      const pending = total - completed;

      const completionRate =
        total === 0
          ? 0
          : Math.round((completed / total) * 100);

      setStats({
        total,
        completed,
        pending,
        completionRate,
      });

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadTaskStats();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 mt-8 transition-colors duration-300">

      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
        📋 Task Completion Tracking
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-green-50 dark:bg-green-950/50 rounded-2xl p-5 border border-transparent dark:border-green-900/40">
          <p className="text-gray-500 dark:text-slate-400">
            ✅Completed
          </p>

          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats.completed}
          </h3>
        </div>

        <div className="bg-orange-50 dark:bg-amber-950/50 rounded-2xl p-5 border border-transparent dark:border-amber-900/40">
          <p className="text-gray-500 dark:text-slate-400">
            ⏳Pending
          </p>

          <h3 className="text-3xl font-bold text-orange-500 dark:text-amber-400 mt-2">
            {stats.pending}
          </h3>
        </div>

      </div>

      <div className="mt-6">

        <div className="flex justify-between mb-2 text-slate-700 dark:text-slate-300">

          <span>Total Tasks</span>

          <span>{stats.total}</span>

        </div>

        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden">

          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-700"
            style={{
              width: `${stats.completionRate}%`,
            }}
          />

        </div>

        <p className="text-center mt-3 font-semibold text-green-600 dark:text-green-400">
          {stats.completionRate}% Completed
        </p>
        
        <p className="text-center text-gray-500 dark:text-slate-400 text-sm mt-2">
        {stats.completed} of {stats.total} tasks completed
        </p>

      </div>

    </div>
  );
}

export default TaskCompletionTracker;