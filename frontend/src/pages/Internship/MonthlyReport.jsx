import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function MonthlyReport() {
  const [report, setReport] = useState({
    hours: 0,
    tasks: 0,
    workLogs: 0,
    completion: 0,
    streak: 0,
    xp: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // User Stats
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let hours = 0;
      let streak = 0;
      let xp = 0;

      if (userSnap.exists()) {
        const data = userSnap.data();

        hours = data.todayHours || 0;
        streak = data.streak || 0;
        xp = data.xp || 0;
      }

      // Tasks
      const taskQuery = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );

      const taskSnap = await getDocs(taskQuery);

      let total = 0;
      let completed = 0;

      taskSnap.forEach((doc) => {
        total++;

        if (doc.data().completed) completed++;
      });

      // Work Logs
      const workQuery = query(
        collection(db, "internshipLogs"),
        where("userId", "==", user.uid)
      );

      const workSnap = await getDocs(workQuery);

      const workLogs = workSnap.size;

      setReport({
        hours,
        tasks: completed,
        workLogs,
        completion:
          total === 0
            ? 0
            : Math.round((completed / total) * 100),
        streak,
        xp,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 mt-6 sm:mt-8 transition-colors duration-300">

      <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-slate-800 dark:text-slate-100">
        📅 Monthly Internship Report
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">

        <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-indigo-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">⏰ Hours Worked</p>
          <h3 className="text-xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5 sm:mt-2">
            {report.hours} hrs
          </h3>
        </div>

        <div className="bg-green-50 dark:bg-green-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-green-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">✅ Tasks Done</p>
          <h3 className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1.5 sm:mt-2">
            {report.tasks}
          </h3>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-blue-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">📝 Work Logs</p>
          <h3 className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1.5 sm:mt-2">
            {report.workLogs}
          </h3>
        </div>

        <div className="bg-orange-50 dark:bg-amber-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-amber-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">📈 Completion</p>
          <h3 className="text-xl sm:text-3xl font-bold text-orange-500 dark:text-amber-400 mt-1.5 sm:mt-2">
            {report.completion}%
          </h3>
        </div>

        <div className="bg-pink-50 dark:bg-pink-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-pink-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">🔥 Streak</p>
          <h3 className="text-xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400 mt-1.5 sm:mt-2">
            {report.streak} Days
          </h3>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-transparent dark:border-purple-900/40">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">🏆 XP Earned</p>
          <h3 className="text-xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1.5 sm:mt-2">
            {report.xp}
          </h3>
        </div>

      </div>

    </div>
  );
}

export default MonthlyReport;