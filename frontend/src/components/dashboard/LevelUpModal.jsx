function LevelUpModal({ isOpen, level, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-[440px] text-center shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 animate-in zoom-in-95 duration-200">
        <div className="text-5xl sm:text-7xl mb-3 sm:mb-4 animate-bounce">
          🎉
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
          LEVEL UP!
        </h2>

        <p className="mt-3 sm:mt-5 text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
          🐼 Your Panda companion reached
        </p>

        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/40 rounded-xl sm:rounded-2xl py-2 sm:py-3 px-4 sm:px-6 inline-block mt-2 sm:mt-3 shadow-inner">
          <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400">
            Level {level}
          </p>
        </div>

        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
          Keep completing tasks and leveling up to grow your Panda companion!
        </p>

        <button
          onClick={onClose}
          className="mt-6 sm:mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

export default LevelUpModal;