function StatsCard({
  title,
  value,
  color,
  progress = 100,
}) {
  const getProgressBarColor = () => {
    if (color.includes("green")) return "bg-emerald-500";
    if (color.includes("orange") || color.includes("amber")) return "bg-amber-505";
    if (color.includes("purple")) return "bg-purple-500";
    return "bg-indigo-500";
  };

  return (
    <div className="glass-premium glass-hover rounded-[24px] p-6 flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
          </h2>

          <p className={`text-3xl font-black mt-3.5 tracking-tight ${color}`}>
            {value}
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-[#0c1222] flex items-center justify-center text-lg border border-slate-200/60 dark:border-slate-800 shadow-inner flex-shrink-0 select-none">
          {title.split(" ")[0]}
        </div>
      </div>

      <div className="mt-5">
        <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5 overflow-hidden shadow-inner border border-slate-250/20 dark:border-slate-800/40">
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