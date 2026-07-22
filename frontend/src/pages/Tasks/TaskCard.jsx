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
      className={`rounded-3xl border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
        isOverdue
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60"
          : task.completed
          ? "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-800/50"
          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
      }`}
    >

      <div className="flex justify-between items-start">

        {/* Left Side */}
        <div className="flex-1">

          <div className="flex flex-wrap gap-2 mb-4">

            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
              {getCategoryEmoji()} {task.category || "Other"}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityStyle()}`}
            >
              {task.priority} Priority
            </span>

            {task.completed && (
              <span className="bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Completed
              </span>
            )}

            {isOverdue && (
              <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                <AlertTriangle size={14} />
                Overdue
              </span>
            )}

          </div>

          <h3
            className={`text-2xl font-bold ${
              task.completed
                ? "line-through text-gray-400 dark:text-slate-500"
                : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {task.title}
          </h3>

          <p className="text-gray-500 dark:text-slate-400 mt-3">
            📅 Due Date:
            <span className="font-medium ml-2 text-slate-700 dark:text-slate-300">
              {task.dueDate || "No Date"}
            </span>
          </p>

          {isOverdue && (
            <div className="mt-4 bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl inline-flex items-center gap-2 border border-transparent dark:border-red-800/50">
              <AlertTriangle size={18} />
              This task is overdue and needs attention.
            </div>
          )}

        </div>

        {/* Right Side */}

        <div className="flex flex-col gap-3 ml-6">

          <button
            onClick={() => onComplete(task.id)}
            className={`p-3 rounded-2xl transition cursor-pointer ${
              task.completed
                ? "bg-green-500 text-white"
                : "bg-green-100 dark:bg-green-950/80 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
            }`}
          >
            <CheckCircle2 size={20} />
          </button>

          <button
            onClick={() => onEdit(task)}
            className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition cursor-pointer"
          >
            <Pencil size={20} />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition cursor-pointer"
          >
            <Trash2 size={20} />
          </button>

        </div>

      </div>

    </div>
  );
}

export default TaskCard;