import { useState, useMemo } from "react";
import { db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { createPortal } from "react-dom";
import CustomSelect from "../../components/Common/CustomSelect";

function EditTaskModal({
  isOpen,
  onClose,
  task,
  existingCategories = [],
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [category, setCategory] = useState(task?.category || "Other");
  const [customCategory, setCustomCategory] = useState("");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [estimatedDuration, setEstimatedDuration] = useState(task?.estimatedDuration || 30);
  const [energyLevel, setEnergyLevel] = useState(task?.energyLevel || "Medium");
  const [description, setDescription] = useState(task?.description || "");

  const categoryOptions = useMemo(() => {
    const base = ["College", "Internship", "Personal"];
    const custom = new Set();
    (existingCategories || []).forEach((c) => {
      if (c && !["All", "College", "Internship", "Personal", "Other"].includes(c)) {
        custom.add(c);
      }
    });
    if (task?.category && !base.includes(task.category) && task.category !== "Other") {
      custom.add(task.category);
    }
    return [
      ...base,
      ...Array.from(custom).sort((a, b) => a.localeCompare(b)),
      "Other",
    ];
  }, [existingCategories, task?.category]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter task title.");
      return;
    }

    if (dueDate && dueDate < new Date().toLocaleDateString("en-CA")) {
      alert("Due date cannot be in the past.");
      return;
    }

    let finalCategory = category;
    if (category === "Other") {
      const trimmed = customCategory.trim();
      if (trimmed) {
        finalCategory = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      } else {
        finalCategory = "Other";
      }
    }

    try {
      const taskRef = doc(
        db,
        "tasks",
        task.id
      );

      await updateDoc(taskRef, {
        title,
        description,
        category: finalCategory,
        priority,
        dueDate,
        estimatedDuration: Number(estimatedDuration),
        energyLevel,
      });

      // Persist custom category locally so it survives future task deletions
      if (finalCategory && !["College", "Internship", "Personal", "Other"].includes(finalCategory)) {
        try {
          const saved = JSON.parse(localStorage.getItem("taskpanda_custom_categories") || "[]");
          if (!saved.includes(finalCategory)) {
            localStorage.setItem("taskpanda_custom_categories", JSON.stringify([...saved, finalCategory]));
          }
        } catch {
          // Ignore
        }
      }

      onClose(finalCategory);

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50 p-3 sm:p-4">
      {/* Backdrop dark overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-md z-40" 
        onClick={onClose} 
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 w-full max-w-lg shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300 z-50 box-border">

        {/* Header */}

        <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">

          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              ✏️ Edit Task
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
              Update your task details and stay organized.
            </p>
          </div>

          <div className="text-3xl sm:text-5xl">
            🐼
          </div>

        </div>

        <div className="space-y-4 sm:space-y-5 flex-grow overflow-y-auto pr-2 scrollbar-thin text-left">

          {/* Description */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>

            <textarea
              rows="3"
              placeholder="Describe the task..."
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

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
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Priority
            </label>

            <CustomSelect
              ariaLabel="Priority"
              value={priority}
              onChange={(val) => setPriority(val)}
              options={["High", "Medium", "Low"]}
              buttonClassName="!rounded-xl sm:!rounded-2xl !p-3 sm:!p-4 !text-sm sm:!text-base"
            />
          </div>

          {/* Energy Requirement */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Energy Requirement
            </label>

            <CustomSelect
              ariaLabel="Energy Requirement"
              value={energyLevel}
              onChange={(val) => setEnergyLevel(val)}
              options={["High", "Medium", "Low"]}
              buttonClassName="!rounded-xl sm:!rounded-2xl !p-3 sm:!p-4 !text-sm sm:!text-base"
            />
          </div>

          {/* Estimated Duration */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Estimated Duration (Minutes)
            </label>

            <input
              type="number"
              min="5"
              step="5"
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(Number(e.target.value))}
            />
          </div>

          {/* Category */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>

            <CustomSelect
              ariaLabel="Category"
              value={category}
              onChange={(val) => {
                setCategory(val);
                if (val !== "Other") {
                  setCustomCategory("");
                }
              }}
              options={categoryOptions}
              buttonClassName="!rounded-xl sm:!rounded-2xl !p-3 sm:!p-4 !text-sm sm:!text-base"
            />
          </div>

          {/* Custom Category Input (shown when Other is selected) */}
          {category === "Other" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                Custom Category / Reason
              </label>

              <input
                type="text"
                placeholder="Enter custom category (e.g. Work, Fitness, Freelance)..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border-2 border-indigo-500/40 dark:border-indigo-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                ✨ This will automatically update your filter tags.
              </p>
            </div>
          )}

          {/* Due Date */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Due Date
            </label>

            <input
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Footer Buttons */}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-4 mt-4 sm:mt-6 flex-shrink-0">

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-sm sm:text-base transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 font-semibold text-sm sm:text-base transition cursor-pointer shadow-md hover:shadow-indigo-500/25"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>,
    document.body
  );
}

export default EditTaskModal;