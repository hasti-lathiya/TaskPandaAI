function AchievementUnlockModal({ achievement, onClose }) {
  if (!achievement) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 md:p-10 w-full max-w-[440px] text-center shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 animate-in zoom-in-95 duration-200">
        <div className="text-7xl mb-4 animate-bounce">
          🎉
        </div>

        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-amber-500 to-indigo-600 dark:from-amber-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
          Achievement Unlocked!
        </h2>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100/40 dark:border-amber-900/40 rounded-2xl py-5 px-6 mt-5 shadow-inner">
          <div className="text-5xl mb-2">{achievement.icon}</div>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">
            {achievement.title}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {achievement.description}
          </p>
        </div>

        <p className="mt-5 text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
          +{achievement.xpReward} XP
        </p>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

export default AchievementUnlockModal;
