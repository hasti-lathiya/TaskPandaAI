import {
  CheckCircle2,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";

function TaskCard({
  task,
  onComplete,
  onDelete,
  onEdit,
}) {
  const getCategoryEmoji = () => {
    switch (task.category) {
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

  const getPriorityStyle = () => {
    switch (task.priority) {
      case "High":
        return "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50";

      case "Medium":
        return "bg-yellow-50 dark:bg-amber-950/60 text-yellow-700 dark:text-amber-400 border-yellow-100 dark:border-amber-800/50";

      case "Low":
        return "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50";

      default:
        return "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700";
    }
  };

  const isOverdue =
    !task.completed &&
    task.dueDate &&
    new Date(task.dueDate) < new Date();

  return (
    <div
      className={`rounded-2xl sm:rounded-[24px] border p-4 sm:p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group relative ${
        isOverdue
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
          : task.completed
          ? "bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-900/30"
          : "glass-premium bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Top Header: Badges & Action Toolbar */}
      <div className="flex items-start justify-between gap-2.5 mb-3 sm:mb-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="bg-slate-100 dark:bg-slate-800/85 text-slate-700 dark:text-slate-300 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border border-slate-200/10 dark:border-slate-800/30">
            {getCategoryEmoji()} {task.category || "Other"}
          </span>

          <span
            className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border ${getPriorityStyle()}`}
          >
            {task.priority} Priority
          </span>

          {task.completed && (
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/10">
              ✅ Completed
            </span>
          )}

          {isOverdue && (
            <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border border-red-500/10">
              <AlertTriangle size={12} />
              Overdue
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-1 sm:p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800 shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onComplete(task.id)}
            title="Complete Task"
            className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer hover:scale-105 active:scale-95 ${
              task.completed
                ? "bg-emerald-500 text-white"
                : "bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900"
            }`}
          >
            <CheckCircle2 size={16} />
          </button>

          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            className="p-1.5 sm:p-2 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-200 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            title="Delete Task"
            className="p-1.5 sm:p-2 rounded-lg bg-red-100/80 dark:bg-red-950/80 text-red-600 dark:text-red-400 hover:bg-red-200 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-lg sm:text-2xl font-bold sm:font-black tracking-tight break-words ${
          task.completed
            ? "line-through text-slate-400 dark:text-slate-600"
            : "text-slate-800 dark:text-slate-100"
        }`}
      >
        {task.title}
      </h3>

      {/* Due date */}
      <p className="text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 text-xs sm:text-sm font-semibold">
        📅 Due Date:
        <span className="font-bold ml-1.5 sm:ml-2 text-slate-700 dark:text-slate-300">
          {task.dueDate || "No Date"}
        </span>
      </p>

      {isOverdue && (
        <div className="mt-3 sm:mt-4 bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl inline-flex items-center gap-2 border border-red-200/20 dark:border-red-900/30 text-xs font-bold">
          <AlertTriangle size={15} />
          <span>This task is overdue and needs attention.</span>
        </div>
      )}
    </div>
  );
}

export default TaskCard;