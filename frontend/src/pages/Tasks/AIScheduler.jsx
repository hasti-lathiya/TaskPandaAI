import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../../firebase/firebase";

import { generateAISchedule } from "../../services/gemini";
import MainLayout from "../../layouts/MainLayout";

function AIScheduler() {
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const taskList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (!data.completed) {
          taskList.push(data);
        }
      });

      if (taskList.length === 0) {
        alert("No pending tasks found.");
        return;
      }

      const result = await generateAISchedule(taskList);

      setSchedule(result);

    } catch (error) {
      console.log(error);
      alert("Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-300 rounded-3xl">

      {/* Hero */}

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-[28px] px-8 py-6 text-white shadow-xl relative overflow-hidden">

        <div className="absolute right-8 top-6 text-5xl opacity-90">
          🐼
        </div>

        <h1 className="text-3xl font-bold mb-2">
          🤖 Panda AI Scheduler
        </h1>

        <p className="text-base opacity-90 max-w-xl">
          Your intelligent productivity partner that plans your day,
          balances your workload and helps you stay ahead.
        </p>

      </div>

      {/* Features */}

      <div className="grid md:grid-cols-3 gap-5 mt-6">

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-md">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">High Priority</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Urgent tasks come first.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-md">
          <div className="text-4xl mb-3">🧠</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Smart Planning</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Uses energy-based scheduling.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-md">
          <div className="text-4xl mb-3">🐼</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Suggestions</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Personalized recommendations.
          </p>
        </div>

      </div>

      {/* Generate */}

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-xl mt-8">

        <div className="flex justify-center">
            

          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:scale-105 transition cursor-pointer"
          >
            {loading
              ? "🤖 Generating..."
              : "✨ Generate AI Schedule"}
          </button>

        </div>

        {/* Loading */}

        {loading && (
          <div className="mt-8 bg-indigo-50 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-900/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-4xl animate-bounce">🐼</div>

            <div>
              <h3 className="font-bold text-indigo-700 dark:text-indigo-300">
                Panda AI is thinking...
              </h3>

              <p className="text-gray-500 dark:text-slate-400 text-sm">
                Creating the perfect schedule for you.
              </p>
            </div>
          </div>
        )}

        {/* Schedule */}

        {schedule && !loading && (
          <div className="mt-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl">
                📅
              </div>

              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  AI Generated Schedule
                </h2>

                <p className="text-gray-500 dark:text-slate-400">
                  Your personalized productivity timeline.
                </p>
              </div>

            </div>

            {/* Timeline */}

            <div className="space-y-3">

              {schedule
  .split("\n")
  .filter((line) => line.trim() !== "")
  .map((line, index) => {

    if (
      line === "Morning" ||
      line === "Afternoon" ||
      line === "Evening"
    ) {
      return (
        <h2
          key={index}
          className="text-2xl font-bold mt-8 mb-4 text-orange-500 dark:text-amber-400"
        >
          {line === "Morning" && "🌅 Morning"}
          {line === "Afternoon" && "☀️ Afternoon"}
          {line === "Evening" && "🌙 Evening"}
        </h2>
      );
    }

    const [time, category, task, badge] =
      line.split("|").map((item) => item.trim());

    const colors = {
        Study: "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300",
        Internship: "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300",
        Exercise: "bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-300",
        Personal: "bg-orange-100 dark:bg-amber-950/70 text-orange-700 dark:text-amber-300",
        Break: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300",
        Urgent: "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300",
        Other: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    };

    const dots = {
        Study: "bg-blue-500",
        Internship: "bg-purple-500",
        Exercise: "bg-green-500",
        Personal: "bg-orange-500",
        Break: "bg-gray-400",
        Urgent: "bg-red-500",
        Other: "bg-slate-500",
    };

    return (
      <div
        key={index}
        className="grid grid-cols-[16px_170px_1fr_120px] items-center gap-4 py-4 border-b border-gray-100 dark:border-slate-800"
      >
        <div
          className={`w-5 h-5 rounded-full ${dots[badge] || dots[category] || "bg-slate-500"} shadow-md`}
        ></div>

        <div className="font-semibold text-purple-600 dark:text-purple-400">
          {time}
        </div>

        <div className="font-medium text-gray-800 dark:text-slate-200">
          {task}
        </div>

        <div
          className={`px-4 py-2 rounded-full text-center text-sm font-semibold ${colors[badge]}`}
        >
          {badge}
        </div>
      </div>
    );
  })}

            </div>

          </div>
        )}

      </div>

    </div>
  </MainLayout>
);
}

export default AIScheduler;