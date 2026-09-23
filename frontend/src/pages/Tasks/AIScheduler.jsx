import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../../firebase/firebase";
import { generateAISchedule } from "../../services/gemini";
import MainLayout from "../../layouts/MainLayout";

function AIScheduler() {
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore the most recent schedule so generating one isn't throwaway work
  // that disappears the moment you navigate away.
  useEffect(() => {
    const loadLatest = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snapshot = await getDocs(
          query(
            collection(db, "aiSchedules"),
            where("userId", "==", user.uid)
          )
        );

        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data());
          // Sort descending client-side so no composite index is needed
          list.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });
          if (list[0]?.content) {
            setSchedule(list[0].content);
          }
        }
      } catch (err) {
        console.error("Could not load saved schedule:", err);
      }
    };

    loadLatest();
  }, []);

  const handleGenerateSchedule = async () => {
    if (loading) return;

    const user = auth.currentUser;
    if (!user) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
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
        setError("No pending tasks found. Add some tasks to generate a schedule.");
        return;
      }

      const result = await generateAISchedule(taskList);
      const cleanedResult = result.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "").trim();
      setSchedule(cleanedResult);

      await addDoc(collection(db, "aiSchedules"), {
        userId: user.uid,
        content: cleanedResult,
        createdAt: serverTimestamp(),
      });

    } catch (err) {
      console.error(err);
      setError("Failed to generate your schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto py-2 sm:py-4 transition-all duration-300 animate-fade-in">
        
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              🤖 Panda AI Scheduler
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xl font-medium">
              Your intelligent productivity partner that balances your day, structures your energy-levels, and helps you stay ahead.
            </p>
          </div>

          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            aria-busy={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {loading ? "🤖 Generating..." : "✨ Generate AI Schedule"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl mb-6 font-bold text-xs sm:text-sm text-center shadow-sm"
          >
            {error}
          </div>
        )}

        {/* Hero Card Banner */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 dark:from-indigo-950 dark:via-[#0c0f19] dark:to-slate-950 rounded-2xl sm:rounded-[32px] px-5 sm:px-8 py-6 sm:py-8 text-slate-800 dark:text-white border border-indigo-100/80 dark:border-slate-800/80 shadow-sm shadow-indigo-500/5 dark:shadow-xl relative overflow-hidden mb-6 sm:mb-8 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-5xl sm:text-7xl opacity-20 dark:opacity-10 select-none pointer-events-none">
            🐼
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-black bg-indigo-100/70 dark:bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
              Generative Pacing Engine
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-3 sm:mt-4 mb-2 tracking-tight text-slate-800 dark:text-slate-50">
              How does the Scheduler work?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              We compile your pending tasks directly from Firestore, filter for priority weights and category constraints, and query Gemini to draft a balanced hourly layout aligned with cognitive health best-practices.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="glass-premium rounded-2xl sm:rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 border border-amber-500/10">
              ⚡
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">High Priority First</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed font-medium">
              Critical assignments, deadlines, and high-priority tags are scheduled first to lock in core milestones.
            </p>
          </div>

          <div className="glass-premium rounded-2xl sm:rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 border border-indigo-500/10">
              🧠
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Smart Energy Pacing</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed font-medium">
              Organizes work by scheduling cognitively intense tasks during high-energy windows with healthy rest blocks.
            </p>
          </div>

          <div className="glass-premium rounded-2xl sm:rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-pink-500/10 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 border border-pink-500/10">
              🐼
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Companion Growth Pacing</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed font-medium">
              Includes specific intervals mapped to your Panda growth cycles to help balance work and gamified play.
            </p>
          </div>
        </div>

        {/* Loading state block */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-md flex items-center gap-4 sm:gap-5 animate-pulse">
            <div className="text-4xl sm:text-5xl animate-bounce">🐼</div>
            <div>
              <h3 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base sm:text-lg">
                Panda AI is thinking...
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                Balancing workload and structuring the perfect timeline for you.
              </p>
            </div>
          </div>
        )}

        {/* Generated Schedule timeline panel */}
        {schedule && !loading && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-100 dark:border-slate-800 pb-4 sm:pb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl sm:text-2xl shadow-md">
                📅
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-50">
                  AI Generated Schedule
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Your personalized productivity timeline.
                </p>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-1 sm:space-y-2">
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
                        className="text-base sm:text-xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-orange-500 dark:text-amber-400 border-b border-orange-100 dark:border-amber-900/30 pb-2"
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
                    Study: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100/30",
                    Internship: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100/30",
                    Exercise: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-100/30",
                    Personal: "bg-orange-50 dark:bg-amber-950/40 text-orange-700 dark:text-amber-400 border border-orange-100/30",
                    Break: "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-100/30",
                    Urgent: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100/30",
                    Other: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100/30",
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
                      className="p-3 sm:px-4 sm:py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-gray-100 dark:border-slate-800/60 last:border-b-0"
                    >
                      {/* Desktop View (sm and up) */}
                      <div className="hidden sm:flex sm:items-center sm:gap-4 w-full">
                        <div
                          className={`w-3 h-3 rounded-full ${dots[badge] || dots[category] || "bg-slate-500"} shadow-sm shrink-0`}
                        />
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0 min-w-[170px] whitespace-nowrap">
                          {time}
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1 min-w-0 truncate">
                          {task}
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-center text-xs font-bold shrink-0 ${colors[badge] || colors[category] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                        >
                          {badge || category}
                        </div>
                      </div>

                      {/* Mobile View (< sm) */}
                      <div className="sm:hidden flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${dots[badge] || dots[category] || "bg-slate-500"} shrink-0`}
                            />
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs whitespace-nowrap">
                              {time}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${colors[badge] || colors[category] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                          >
                            {badge || category}
                          </span>
                        </div>
                        <div className="pl-4.5 font-semibold text-slate-800 dark:text-slate-100 text-xs leading-snug">
                          {task}
                        </div>
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