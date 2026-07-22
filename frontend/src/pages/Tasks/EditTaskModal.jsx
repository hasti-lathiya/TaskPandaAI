import { useState } from "react";
import { db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

function EditTaskModal({
  isOpen,
  onClose,
  task,
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Other");
  const [dueDate, setDueDate] = useState("");
  const [prevTaskId, setPrevTaskId] = useState(null);

  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setTitle(task.title || "");
    setPriority(task.priority || "Medium");
    setCategory(task.category || "Other");
    setDueDate(task.dueDate || "");
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter task title.");
      return;
    }

    try {
      const taskRef = doc(
        db,
        "tasks",
        task.id
      );

      await updateDoc(taskRef, {
        title,
        category,
        priority,
        dueDate,
      });

      alert("✅ Task Updated Successfully!");

      onClose();

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-8 w-full max-w-lg shadow-2xl transition-colors duration-300">

        {/* Header */}

        <div className="flex justify-between items-center mb-8">

          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              ✏️ Edit Task
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Update your task details and stay organized.
            </p>
          </div>

          <div className="text-5xl">
            🐼
          </div>

        </div>

        <div className="space-y-5">

          {/* Title */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Task Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Enter task title..."
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option className="dark:bg-slate-800">College</option>
              <option className="dark:bg-slate-800">Internship</option>
              <option className="dark:bg-slate-800">Personal</option>
              <option className="dark:bg-slate-800">Other</option>
            </select>
          </div>

          {/* Priority */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option className="dark:bg-slate-800">High</option>
              <option className="dark:bg-slate-800">Medium</option>
              <option className="dark:bg-slate-800">Low</option>
            </select>
          </div>

          {/* Due Date */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Due Date
            </label>

            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Footer Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>
  );
}

export default EditTaskModal;