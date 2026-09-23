import { Lock, CheckCircle2 } from "lucide-react";
import useAchievements from "../../hooks/useAchievements";

function formatUnlockDate(unlockedAt) {
  if (!unlockedAt) return "";
  const date = unlockedAt.toDate ? unlockedAt.toDate() : new Date(unlockedAt);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AchievementsPanel() {
  const { achievements, loading, unlockedCount, totalCount } = useAchievements();

  return (
    <div className="glass-premium rounded-2xl sm:rounded-[24px] p-4 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            🏆 Achievements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Unlock badges by staying productive
          </p>
        </div>

        <div className="bg-indigo-500/10 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border border-indigo-500/10 dark:border-indigo-500/30 shadow-sm">
          {unlockedCount} / {totalCount}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-gray-500 dark:text-slate-400">
          <div className="text-3xl animate-bounce">🐼</div>
          <span className="text-sm font-semibold">Loading achievements...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col ${
                a.unlocked
                  ? "bg-gradient-to-br from-amber-500/10 to-indigo-500/10 dark:from-amber-500/15 dark:to-indigo-500/15 border-amber-500/30 dark:border-amber-400/30 shadow-sm"
                  : "bg-slate-50/50 dark:bg-slate-800 border-transparent dark:border-slate-800 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-3xl select-none ${a.unlocked ? "" : "grayscale opacity-50"}`}>
                  {a.icon}
                </span>
                {a.unlocked ? (
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <Lock size={14} className="text-slate-400 flex-shrink-0" />
                )}
              </div>

              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {a.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed flex-grow">
                {a.description}
              </p>

              {a.unlocked ? (
                <div className="mt-3 pt-3 border-t border-amber-500/20 dark:border-amber-400/20">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Unlocked
                  </span>
                  {a.unlockedAt && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatUnlockDate(a.unlockedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((a.progress / a.target) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold">
                    {a.progress} / {a.target}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AchievementsPanel;
