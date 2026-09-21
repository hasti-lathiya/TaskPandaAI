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
    <div className="bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 rounded-[32px] p-8 mb-8 transition-all duration-500 relative overflow-hidden shadow-sm shadow-indigo-500/5">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 dark:bg-pink-600/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-8 xl:gap-16 w-full">
        {/* Left Side: Welcome and motivation */}
        <div className="flex-grow max-w-xl flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-3xl shadow-inner border border-white/20 dark:border-slate-800/40 select-none animate-float">
                👋
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-50 tracking-tight leading-tight">
                  {headline}
                </h1>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-relaxed max-w-lg">
              Small daily improvements build massive long-term success. What's your top priority right now?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700/85 hover:shadow-lg dark:hover:shadow-indigo-500/10 border border-slate-800 dark:border-slate-700 px-5 py-3 rounded-2xl text-sm font-bold text-white dark:text-slate-100 transition duration-300 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm"
            >
              ➕ Quick Task
            </button>
            <button
              onClick={() => alert(`You have ${pendingTasksCount} pending tasks to prioritize today.`)}
              className="bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-500/10 dark:border-emerald-500/40 px-5 py-3 rounded-2xl text-sm font-bold text-emerald-700 dark:text-emerald-400 transition duration-300 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm"
            >
              🎯 Today's Focus ({pendingTasksCount} Pending)
            </button>
            <span className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-200/30 dark:border-indigo-800/40 px-5 py-3 rounded-2xl text-sm font-bold text-indigo-700 dark:text-indigo-400 shadow-sm flex items-center justify-center gap-2">
              🐾 Companion Level {level}
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Frosted Panda Companion */}
        <div className="w-full xl:w-[620px] min-h-[300px] flex-shrink-0 bg-white/60 dark:bg-[#070b14]/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 rounded-[32px] p-10 shadow-md flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden glass-hover group">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 dark:via-indigo-500/2 dark:to-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />
          
          <div className="flex-shrink-0 bg-gradient-to-tr from-indigo-500/5 to-pink-500/5 dark:from-slate-800 dark:to-slate-800 p-6 rounded-[28px] border border-white/60 dark:border-slate-800 shadow-inner animate-float select-none">
            <PandaAvatar level={level} companion={equippedCompanion} />
          </div>

          <div className="flex-1 w-full relative z-10">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-1.5 tracking-tight">
                {equippedCompanion} Companion
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-200/30">
                Lv. {level}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4.5 font-semibold">
              Help your companion grow by completing tasks
            </p>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1.5">
                <span>Growth Progress</span>
                <span>{progress}/100 XP</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/20 dark:border-slate-800/40">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Gamification Stats badges */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-950/20 dark:to-amber-950/30 rounded-2xl py-4 px-3 border border-amber-500/10 dark:border-amber-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-amber-500/30 shadow-sm">
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">🪙 Coins</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">{coins}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 dark:from-rose-950/20 dark:to-rose-950/30 rounded-2xl py-4 px-3 border border-rose-500/10 dark:border-rose-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-rose-500/30 shadow-sm">
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">🔥 Streak</p>
                <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">{streak} Days</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 dark:from-indigo-950/20 dark:to-indigo-950/30 rounded-2xl py-4 px-3 border border-indigo-500/10 dark:border-indigo-900/30 text-center relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 shadow-sm">
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">🏆 Badges</p>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{unlockedCount}/{totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeCard;