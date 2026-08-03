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

      default:
        return "📦";
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
      className={`rounded-[24px] border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group relative ${
        isOverdue
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
          : task.completed
          ? "bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-900/30"
          : "glass-premium bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Floating horizontal actions toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 bg-white/95 dark:bg-slate-850/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800 shadow-md z-10">
        <button
          onClick={() => onComplete(task.id)}
          title="Complete Task"
          className={`p-2 rounded-lg transition cursor-pointer hover:scale-105 active:scale-95 ${
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
          className="p-2 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-200 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => onDelete(task.id)}
          title="Delete Task"
          className="p-2 rounded-lg bg-red-100/80 dark:bg-red-950/80 text-red-650 dark:text-red-400 hover:bg-red-200 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex justify-between items-start">
        {/* Left Side */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-6 pr-24">
            <span className="bg-slate-100 dark:bg-slate-850/85 text-slate-750 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/10 dark:border-slate-800/30">
              {getCategoryEmoji()} {task.category || "Other"}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityStyle()}`}
            >
              {task.priority} Priority
            </span>

            {task.completed && (
              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/10">
                ✅ Completed
              </span>
            )}

            {isOverdue && (
              <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/10">
                <AlertTriangle size={12} />
                Overdue
              </span>
            )}
          </div>

          <h3
            className={`text-2xl font-black tracking-tight pr-24 ${
              task.completed
                ? "line-through text-slate-400 dark:text-slate-600"
                : "text-slate-800 dark:text-slate-105"
            }`}
          >
            {task.title}
          </h3>

          <p className="text-slate-500 dark:text-slate-450 mt-3.5 text-sm font-semibold pr-24">
            📅 Due Date:
            <span className="font-bold ml-2 text-slate-705 dark:text-slate-300">
              {task.dueDate || "No Date"}
            </span>
          </p>

          {isOverdue && (
            <div className="mt-4 bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-350 px-4 py-3 rounded-2xl inline-flex items-center gap-2 border border-red-200/20 dark:border-red-900/30 text-xs font-bold">
              <AlertTriangle size={16} />
              This task is overdue and needs attention.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;