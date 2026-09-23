function WeeklyProgress({ todayHours }) {

  const hours = todayHours;

  const currentDay = new Date().toLocaleDateString("en-US", {
    weekday: "short",
  });

  const progress = Math.min((hours / 8) * 100, 100);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mt-6 sm:mt-8 transition-colors duration-300">

      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800 dark:text-slate-100">
        📈 Weekly Progress
      </h2>

      <div className="flex justify-between mb-2">

        <span className="text-xs sm:text-base font-medium text-slate-700 dark:text-slate-300">
          Internship Progress
        </span>

        <span className="text-xs sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
          {progress.toFixed(0)}%
        </span>

      </div>

      <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-3 sm:h-4 overflow-hidden">

        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 sm:h-4 rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-3 mt-6 sm:mt-8">

        {days.map((day) => (

          <div
            key={day}
            className="bg-indigo-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-1.5 sm:p-4 text-center border border-transparent dark:border-slate-700/60"
          >

            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
              {day}
            </p>

            <p className="text-xs sm:text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {day === currentDay ? `${hours}h` : "0h"}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}

export default WeeklyProgress;