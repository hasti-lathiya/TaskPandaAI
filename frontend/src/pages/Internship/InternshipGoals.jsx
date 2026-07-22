import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function InternshipGoals() {
  const [goals, setGoals] = useState({
    hours: false,
    workLog: false,
    tasks: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        setGoals({
          hours: (data.todayHours || 0) >= 8,
          workLog: true,
          tasks: true,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const completed =
    Number(goals.hours) +
    Number(goals.workLog) +
    Number(goals.tasks);

  const progress = Math.round((completed / 3) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 mt-6 transition-colors duration-300">

      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
        🎯 Internship Goals
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Complete 8 Hours</span>
          <span>{goals.hours ? "✅" : "⬜"}</span>
        </div>

        <div className="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Add Daily Work Log</span>
          <span>{goals.workLog ? "✅" : "⬜"}</span>
        </div>

        <div className="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Complete Today's Tasks</span>
          <span>{goals.tasks ? "✅" : "⬜"}</span>
        </div>

      </div>

      <div className="mt-6">

        <div className="flex justify-between mb-2">

          <span className="font-medium text-slate-700 dark:text-slate-300">
            Today's Progress
          </span>

          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {progress}%
          </span>

        </div>

        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4">

          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default InternshipGoals;