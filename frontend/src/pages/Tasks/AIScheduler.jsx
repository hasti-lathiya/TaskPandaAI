import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db, auth } from "../../firebase/firebase";
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
        alert("No pending tasks found. Please add tasks to generate your schedule!");
        return;
      }

      const result = await generateAISchedule(taskList);
      setSchedule(result);

    } catch (error) {
      console.error(error);
      alert("Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-8 transition-all duration-300 animate-fade-in">
        
        {/* Header Title Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              🤖 Panda AI Scheduler
            </h1>
            <p className="text-gray-500 dark:text-slate-450 mt-1 max-w-xl text-sm font-semibold">
              Your intelligent productivity partner that balances your day, structures your energy-levels, and helps you stay ahead.
            </p>
          </div>

          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            className="w-full lg:w-auto bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "🤖 Generating..." : "✨ Generate AI Schedule"}
          </button>
        </div>

        {/* Hero Card Banner */}
        <div className="bg-gradient-to-br from-indigo-950 via-[#0c0f19] to-slate-950 rounded-[32px] px-8 py-8 text-white border border-indigo-500/20 dark:border-slate-800/80 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none pointer-events-none">
            🐼
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs uppercase tracking-widest font-black bg-indigo-500/20 px-3.5 py-1.5 rounded-full border border-indigo-500/30 text-indigo-300">
              Generative Pacing Engine
            </span>
            <h2 className="text-2xl font-black mt-4 mb-2 tracking-tight">
              How does the Scheduler work?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              We compile your pending tasks directly from Firestore, filter for priority weights and category constraints, and query Gemini to draft a balanced hourly layout aligned with cognitive health best-practices.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-premium rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-955/40 text-amber-500 flex items-center justify-center text-2xl mb-4 border border-amber-500/10">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-105">High Priority First</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm leading-relaxed font-medium">
              Critical assignments, deadlines, and high-priority tags are scheduled first to lock in core milestones.
            </p>
          </div>

          <div className="glass-premium rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 text-indigo-505 flex items-center justify-center text-2xl mb-4 border border-indigo-500/10">
              🧠
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-105">Smart Energy Pacing</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm leading-relaxed font-medium">
              Organizes work by scheduling cognitively intense tasks during high-energy windows with healthy rest blocks.
            </p>
          </div>

          <div className="glass-premium rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 dark:bg-pink-950/40 text-pink-550 flex items-center justify-center text-2xl mb-4 border border-pink-500/10">
              🐼
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-105">Companion Growth Pacing</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm leading-relaxed font-medium">
              Includes specific intervals mapped to your Panda growth cycles to help balance work and gamified play.
            </p>
          </div>
        </div>

        {/* Loading state block */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-[32px] p-8 shadow-md flex items-center gap-5 animate-pulse">
            <div className="text-5xl animate-bounce">🐼</div>
            <div>
              <h3 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">
                Panda AI is thinking...
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                Balancing workload and structuring the perfect timeline for you.
              </p>
            </div>
          </div>
        )}

        {/* Generated Schedule timeline panel */}
        {schedule && !loading && (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-[32px] p-8 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-650 text-white flex items-center justify-center text-2xl shadow-md">
                📅
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-50">
                  AI Generated Schedule
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Your personalized productivity timeline.
                </p>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-2">
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
                      <h3
                        key={index}
                        className="text-xl font-bold mt-8 mb-4 text-orange-500 dark:text-amber-400 border-b border-orange-100 dark:border-amber-900/30 pb-2"
                      >
                        {line === "Morning" && "🌅 Morning"}
                        {line === "Afternoon" && "☀️ Afternoon"}
                        {line === "Evening" && "🌙 Evening"}
                      </h3>
                    );
                  }

                  const parts = line.split("|").map((item) => item.trim());
                  if (parts.length < 3) return null;
                  const [time, category, task, badge] = parts;

                  const colors = {
                    Study: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-450 border border-blue-105/30",
                    Internship: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-450 border border-purple-105/30",
                    Exercise: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-450 border border-green-105/30",
                    Personal: "bg-orange-50 dark:bg-amber-950/40 text-orange-700 dark:text-amber-450 border border-orange-105/30",
                    Break: "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-350 border border-gray-105/30",
                    Urgent: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-450 border border-red-105/30",
                    Other: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-105/30",
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
                      className="flex flex-col sm:grid sm:grid-cols-[20px_140px_1fr_120px] items-start sm:items-center gap-2 sm:gap-4 py-4 border-b border-gray-100 dark:border-slate-800/60"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${dots[badge] || dots[category] || "bg-slate-500"} shadow-sm self-start sm:self-auto mt-1 sm:mt-0`}
                      />

                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {time}
                      </div>

                      <div className="font-semibold text-slate-750 dark:text-slate-205 text-sm sm:text-base pr-4">
                        {task}
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-2xl text-center text-xs font-bold ${colors[badge] || colors[category] || "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                      >
                        {badge || category}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default AIScheduler;