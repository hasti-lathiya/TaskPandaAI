function StatsCard({
  title,
  value,
  color,
  progress = 100,
}) {
  const getProgressBarColor = () => {
    if (color.includes("green")) return "bg-emerald-500";
    if (color.includes("orange") || color.includes("amber")) return "bg-amber-500";
    if (color.includes("purple")) return "bg-purple-500";
    return "bg-indigo-500";
  };

  return (
    <div className="glass-premium glass-hover rounded-2xl sm:rounded-[24px] p-3.5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div>
          <h2 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
          </h2>

          <p className={`text-2xl sm:text-3xl font-black mt-1.5 sm:mt-3.5 tracking-tight ${color}`}>
            {value}
          </p>
        </div>

        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-[#0c1222] flex items-center justify-center text-sm sm:text-lg border border-slate-200/60 dark:border-slate-800 shadow-inner flex-shrink-0 select-none">
          {title.split(" ")[0]}
        </div>
      </div>

      <div className="mt-3 sm:mt-5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner border border-slate-200/20 dark:border-slate-800/40">
          <div
            className={`h-1.5 ${getProgressBarColor()} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StatsCard;