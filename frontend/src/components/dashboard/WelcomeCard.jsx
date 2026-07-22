function WelcomeCard() {

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 mb-8 transition-colors duration-300">

      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

        {/* Left Side */}
        <div>

          <div className="flex items-center gap-3 mb-3">

            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-3xl">
              👋
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              🚀 Ready to make progress today?
              </h1>

            <p className="text-lg text-gray-500 dark:text-slate-400 mt-2">
            Small improvements every day create big achievements.
            </p>
            </div>

          </div>

          <p className="text-gray-600 dark:text-slate-300 mt-6 text-lg">
            Stay organized, stay productive, and keep moving forward.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">

            <div className="bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl text-gray-700 dark:text-slate-300">
            📚 Student Productivity Mode
            </div>

            <div className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-transparent dark:border-green-800/40 px-5 py-3 rounded-2xl">
              🎯 Focus on today's priorities
            </div>

          </div>

        </div>

        {/* Right Side */}

        <div className="bg-indigo-50 dark:bg-slate-800/90 rounded-3xl p-6 text-center border border-transparent dark:border-slate-700/60">

          <div className="text-7xl mb-3">
            🐼
          </div>

          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Your Productivity Companion
          </h3>

          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Complete tasks and help your panda grow.
          </p>

        </div>

      </div>

    </div>
  );
}

export default WelcomeCard;