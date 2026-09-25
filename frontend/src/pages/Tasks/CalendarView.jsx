import { useState, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CheckCircle2, Calendar as CalendarIcon, Plus, Pencil, Trash2 } from "lucide-react";

// Local timezone date string (YYYY-MM-DD) helper to prevent UTC offset day shifts
const formatDateKey = (d) => {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (d) => {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCategoryEmoji = (category) => {
  switch (category) {
    case "College":
      return "🎓";
    case "Internship":
      return "💼";
    case "Personal":
      return "🏠";
    case "Work":
      return "💻";
    case "Fitness":
    case "Health":
    case "Gym":
      return "💪";
    case "Finance":
    case "Money":
      return "💰";
    case "Coding":
    case "Project":
      return "⚡";
    case "Shopping":
      return "🛒";
    case "Other":
      return "📦";
    default:
      return "🏷️";
  }
};

const getPriorityStyle = (priority) => {
  switch (priority) {
    case "High":
      return "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40";
    case "Medium":
      return "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40";
    case "Low":
      return "bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/40";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
};

function CalendarView({
  tasks = [],
  onComplete,
  onEdit,
  onDelete,
  onOpenAdd,
}) {
  const [date, setDate] = useState(new Date());

  // Index tasks by local dueDate key (YYYY-MM-DD) for O(1) lookups
  const tasksByDate = useMemo(() => {
    const map = {};
    (tasks || []).forEach((task) => {
      if (task.dueDate) {
        if (!map[task.dueDate]) {
          map[task.dueDate] = [];
        }
        map[task.dueDate].push(task);
      }
    });
    return map;
  }, [tasks]);

  const selectedDateKey = formatDateKey(date);
  const todayKey = formatDateKey(new Date());
  const isToday = selectedDateKey === todayKey;

  const selectedDateTasks = tasksByDate[selectedDateKey] || [];
  const scheduledDatesCount = Object.keys(tasksByDate).length;

  return (
    <div className="glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 mt-6 sm:mt-8 border border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>📅</span>
              <span>Task Calendar</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {scheduledDatesCount} {scheduledDatesCount === 1 ? "Active Day" : "Active Days"}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Click any date on the calendar to view and manage deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(new Date())}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3.5 py-2 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 transition cursor-pointer flex items-center gap-1.5"
            >
              <CalendarIcon size={14} />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Column */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white dark:bg-slate-900/60 rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={({ date: tileDate, view }) => {
              if (view === "month") {
                const key = formatDateKey(tileDate);
                const dayTasks = tasksByDate[key];
                if (!dayTasks || dayTasks.length === 0) return null;

                const count = dayTasks.length;
                const allCompleted = dayTasks.every((t) => t.completed);

                return (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 pointer-events-none">
                    <span
                      className="text-xs leading-none select-none"
                      title={`${count} task${count > 1 ? "s" : ""}`}
                    >
                      {allCompleted ? "✅" : "📌"}
                    </span>
                    {count > 1 && (
                      <span className={`text-[10px] font-extrabold leading-none ${allCompleted ? "text-emerald-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {count}
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
        </div>

        {/* Selected Date Tasks Column */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col min-h-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                  Tasks for {formatDisplayDate(date)}
                </h3>
                {isToday && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedDateTasks.length}{" "}
                {selectedDateTasks.length === 1 ? "task due" : "tasks due"}
              </p>
            </div>

            {onOpenAdd && (
              <button
                type="button"
                onClick={() => onOpenAdd(selectedDateKey)}
                title="Add task for this date"
                className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {/* Tasks List */}
          <div className="flex-1 flex flex-col justify-center">
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-10 px-4 my-auto">
                <div className="text-3xl sm:text-4xl mb-2 select-none">
                  🌴
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                  No tasks due on this date
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px] mx-auto">
                  Enjoy your free time, or schedule something to stay ahead!
                </p>
                {onOpenAdd && (
                  <button
                    type="button"
                    onClick={() => onOpenAdd(selectedDateKey)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1.5 px-3 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Task for {selectedDateKey}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 sm:p-4 transition hover:border-indigo-400/50 dark:hover:border-indigo-500/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {getCategoryEmoji(task.category)} {task.category || "General"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        {task.completed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {onComplete && !task.completed && (
                          <button
                            type="button"
                            onClick={() => onComplete(task.id)}
                            title="Mark as completed"
                            className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            title="Edit task"
                            className="p-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(task)}
                            title="Delete task"
                            className="p-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-200 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words ${
                        task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""
                      }`}
                    >
                      {task.title}
                    </h4>

                    <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      {task.priority} Priority • {task.category || "General"}
                    </p>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {(task.estimatedDuration || task.energyLevel) && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {task.estimatedDuration && (
                          <span>⏱️ {task.estimatedDuration} min</span>
                        )}
                        {task.energyLevel && (
                          <span>⚡ {task.energyLevel} Energy</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;