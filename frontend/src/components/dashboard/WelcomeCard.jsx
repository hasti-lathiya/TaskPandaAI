import { useMemo } from "react";
import PandaAvatar from "./PandaAvatar";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { db, auth } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNotifications } from "../../context/NotificationContext";
import useAchievements from "../../hooks/useAchievements";

function WelcomeCard({ userStats }) {
  const { user: appContextUser, tasks } = useApp();
  const { equippedCompanion } = useTheme();
  const { addNotification } = useNotifications();
  const { unlockedCount, totalCount } = useAchievements();

  const progress = (userStats?.xp || 0) % 100;
  const level = userStats?.level || 1;
  const coins = userStats?.coins || 0;
  const streak = userStats?.streak || 0;

  const displayName = appContextUser?.fullName || "Student";
  const nameToShow = displayName.trim().split(" ")[0].toUpperCase();

  const headline = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return `Ready to conquer today's goals, ${nameToShow}?`;
    } else if (hour >= 12 && hour < 17) {
      return `Keep up the momentum, ${nameToShow}! ⚡`;
    } else {
      return `Reflect on today's wins, ${nameToShow} ✨`;
    }
  }, [nameToShow]);

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 xl:p-8 mb-6 sm:mb-8 transition-all duration-300 relative overflow-hidden shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-6 xl:gap-16 w-full">
        {/* Left Side: Welcome and motivation */}
        <div className="flex-grow max-w-xl flex flex-col gap-4 sm:gap-6 w-full">
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-2xl sm:text-3xl border border-indigo-100 dark:border-indigo-900/50 select-none animate-float shrink-0">
                👋
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-50 tracking-tight leading-tight">
                  {headline}
                </h1>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base font-medium leading-relaxed max-w-lg">
              Small daily improvements build massive long-term success. What's your top priority right now?
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={async () => {
                const taskTitle = window.prompt("Enter quick task title:");
                if (taskTitle?.trim()) {
                  try {
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                      alert("Please log in to add tasks.");
                      return;
                    }
                    await addDoc(collection(db, "tasks"), {
                      title: taskTitle.trim(),
                      description: "Quick task added from Dashboard.",
                      category: "Personal",
                      priority: "Medium",
                      dueDate: new Date().toISOString().split("T")[0],
                      estimatedDuration: 30,
                      energyLevel: "Medium",
                      completed: false,
                      userId: currentUser.uid,
                      createdAt: serverTimestamp(),
                    });
                    await addNotification("Task Created 🎯", `Quick Task Created: ${taskTitle}`, "task");
                  } catch (err) {
                    console.error("Error creating quick task:", err);
                    alert("Failed to create quick task.");
                  }
                }
              }}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700/85 hover:shadow-lg dark:hover:shadow-indigo-500/10 border border-slate-800 dark:border-slate-700 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white dark:text-slate-100 transition duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 sm:gap-2 shadow-sm"
            >
              ➕ Quick Task
            </button>
            <button
              onClick={() => alert(`You have ${pendingTasksCount} pending tasks to prioritize today.`)}
              className="bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-500/10 dark:border-emerald-500/40 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 transition duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 sm:gap-2 shadow-sm"
            >
              🎯 Today's Focus ({pendingTasksCount})
            </button>
            <span className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-200/30 dark:border-indigo-800/40 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2">
              🐾 Lv. {level}
            </span>
          </div>
        </div>

        {/* Right Side: Companion Hero Card */}
        <div className="w-full xl:w-[620px] min-h-0 sm:min-h-[300px] flex-shrink-0 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 xl:p-10 shadow-xs flex flex-col sm:flex-row items-center gap-4 sm:gap-8 relative overflow-hidden group">
          <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-3.5 sm:p-6 rounded-2xl sm:rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-xs animate-float select-none">
            <PandaAvatar level={level} companion={equippedCompanion} />
          </div>

          <div className="flex-1 w-full relative z-10">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 flex items-center gap-1.5 tracking-tight">
                {equippedCompanion} Companion
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-indigo-200/30">
                Lv. {level}
              </span>
            </div>
            
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-3 sm:mb-4.5 font-semibold">
              Help your companion grow by completing tasks
            </p>

            {/* Progress Bar */}
            <div className="mb-4 sm:mb-5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1.5">
                <span>Growth Progress</span>
                <span>{progress}/100 XP</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner border border-slate-200/20 dark:border-slate-800/40">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 sm:h-3 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Gamification Stats badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
              <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-950/20 dark:to-amber-950/30 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-2 sm:px-3 border border-amber-500/10 dark:border-amber-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-amber-500/30 shadow-sm">
                <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">🪙 Coins</p>
                <p className="text-base sm:text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-1">{coins}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 dark:from-rose-950/20 dark:to-rose-950/30 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-2 sm:px-3 border border-rose-500/10 dark:border-rose-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-rose-500/30 shadow-sm">
                <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">🔥 Streak</p>
                <p className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5 sm:mt-1">{streak}d</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 dark:from-indigo-950/20 dark:to-indigo-950/30 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-2 sm:px-3 border border-indigo-500/10 dark:border-indigo-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 shadow-sm">
                <p className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">🏆 Badges</p>
                <p className="text-base sm:text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5 sm:mt-1">{unlockedCount}/{totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeCard;