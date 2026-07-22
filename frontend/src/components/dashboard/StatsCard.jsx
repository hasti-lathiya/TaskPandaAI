function StatsCard({
  title,
  value,
  color,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">

      <div className="flex justify-between items-start">

        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </h2>

          <p
            className={`text-4xl font-bold mt-4 ${color}`}
          >
            {value}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
          {title.split(" ")[0]}
        </div>

      </div>

      <div className="mt-5 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            color.includes("green")
              ? "bg-green-500"
              : color.includes("orange")
              ? "bg-orange-500"
              : color.includes("purple")
              ? "bg-purple-500"
              : "bg-indigo-500"
          } rounded-full w-2/3`}
        />
      </div>

    </div>
  );
}

export default StatsCard;