import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import MainLayout from "../../layouts/MainLayout";
import DailyWorkLog from "./DailyWorkLog";
import HoursTracker from "./HoursTracker";
import WeeklyProgress from "./WeeklyProgress";
import TaskCompletionTracker from "./TaskCompletionTracker";
import MentorFeedback from "./MentorFeedback";
import MonthlyReport from "./MonthlyReport";
import InternshipGoals from "./InternshipGoals";
import { generateInternshipReport } from "../../services/gemini";


function Internship() {
  const [todayHours, setTodayHours] = useState(0);
  const [weeklyTasks, setWeeklyTasks] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setTodayHours(userSnap.data().todayHours || 0);
      }
    });

    return () => unsubscribe();
  }, []);
const generateWeeklyReport = async () => {
  if (!weeklyTasks.trim()) {
    alert("Please enter your work first.");
    return;
  }

  try {
    setGeneratedReport("Generating AI report...");

    const report = await generateInternshipReport(
      weeklyTasks
    );

    setGeneratedReport(report);

  } catch (error) {
    console.log(error);

    setGeneratedReport(
      "Failed to generate report."
    );
  }
};

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  return (
    <MainLayout>

      {/* Page Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          💼 Internship Tracker
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mt-2">
          Track your internship progress and daily work.
        </p>

      </div>

      {/* Hero Card */}

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 mb-8 transition-colors duration-300">

        <div className="flex justify-between items-center">

          <div>

            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              🚀 Keep Growing Every Day
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Small progress every day leads to a successful internship.
            </p>

            <p className="mt-6 font-medium text-slate-500 dark:text-slate-400">
              📅 {today}
            </p>

          </div>

          <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-5xl">
          💼
          </div>

        </div>

      </div>

      {/* Cards */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">

          <h3 className="text-gray-500 dark:text-slate-400">
            ⏰ Hours Today
          </h3>

          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-3">
            {todayHours} / 8
          </p>

        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">

          <h3 className="text-gray-500 dark:text-slate-400">
            📋 Tasks Completed
          </h3>

          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">
            0
          </p>

        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">

          <h3 className="text-gray-500 dark:text-slate-400">
            📅 Days Attended
          </h3>

          <p className="text-4xl font-bold text-orange-500 dark:text-amber-400 mt-3">
            0
          </p>

        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 transition-colors duration-300">

          <h3 className="text-gray-500 dark:text-slate-400">
            📈 Progress
          </h3>

          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-3">
            0%
          </p>

        </div>

      </div>

      {/* Daily Work Log */}

      <div className="grid xl:grid-cols-2 gap-6 mt-8">

      <HoursTracker
      todayHours={todayHours}
      setTodayHours={setTodayHours} />
      <InternshipGoals/>
      <MentorFeedback />

      <DailyWorkLog />

      </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-8 mt-8 mb-8 transition-colors duration-300">

  <h2 className="text-2xl font-bold mb-5 text-slate-800 dark:text-slate-100">
    🤖 AI Weekly Report Generator
  </h2>

  <textarea
    value={weeklyTasks}
    onChange={(e) => setWeeklyTasks(e.target.value)}
    placeholder="Example:
Created Login Page,
Integrated Firebase Authentication,
Fixed Sidebar Bugs"
    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 h-40 outline-none focus:ring-2 focus:ring-indigo-500"
  />

  <button
    onClick={generateWeeklyReport}
    className="mt-5 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium"
  >
    Generate Weekly Report
  </button>

  {generatedReport && (
    <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-transparent dark:border-slate-700">

      <h3 className="font-bold mb-3 text-slate-800 dark:text-slate-100">
        🐼 Generated Report
      </h3>

      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
        {generatedReport}
      </p>

    </div>
  )}

</div>


      <WeeklyProgress todayHours={todayHours} />
      <TaskCompletionTracker />
      <MonthlyReport />
      </MainLayout>
  );
}

export default Internship;