import { useState, useMemo, useEffect } from "react";
import { db, auth } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNotifications } from "../../context/NotificationContext";
import { createPortal } from "react-dom";
import CustomSelect from "../../components/Common/CustomSelect";

function AddTaskModal({ isOpen, onClose, existingCategories = [], initialDueDate = "" }) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(initialDueDate || "");
  const [category, setCategory] = useState("College");
  const [customCategory, setCustomCategory] = useState("");

  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [energyLevel, setEnergyLevel] = useState("Medium");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDueDate(initialDueDate || "");
    }
  }, [isOpen, initialDueDate]);

  const categoryOptions = useMemo(() => {
    const base = ["College", "Internship", "Personal"];
    const custom = new Set();
    (existingCategories || []).forEach((c) => {
      if (c && !["All", "College", "Internship", "Personal", "Other"].includes(c)) {
        custom.add(c);
      }
    });
    return [
      ...base,
      ...Array.from(custom).sort((a, b) => a.localeCompare(b)),
      "Other",
    ];
  }, [existingCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      alert("Task title must be at least 3 characters long.");
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
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        category: finalCategory,
        priority,
        dueDate,
        estimatedDuration,
        energyLevel,
        completed: false,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      await addNotification("Task Created 🎯", `Task Created: ${title}`, "task");

      // Persist custom category locally so it survives future task deletions
      if (finalCategory && !["College", "Internship", "Personal", "Other"].includes(finalCategory)) {
        try {
          const saved = JSON.parse(localStorage.getItem("taskpanda_custom_categories") || "[]");
          if (!saved.includes(finalCategory)) {
            localStorage.setItem("taskpanda_custom_categories", JSON.stringify([...saved, finalCategory]));
          }
        } catch {
          // Ignore localStorage errors
        }
      }

      setTitle("");
      setPriority("Medium");
      setDueDate("");
      setCategory("College");
      setCustomCategory("");
      setEstimatedDuration(30);
      setEnergyLevel("Medium");
      setDescription("");

      onClose(finalCategory);

    } catch (error) {
      alert(error.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-3 sm:p-4">

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 w-full max-w-lg shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">

        {/* Header */}

        <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">

          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              ➕ Add New Task
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
              Create a task and keep your productivity moving.
            </p>
          </div>

          <div className="text-3xl sm:text-5xl">
            🐼
          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 flex-grow overflow-y-auto px-1.5 pr-2.5 py-1 scrollbar-thin"
        >

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>

            <textarea
              rows="3"
              placeholder="Describe the task..."
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>


          {/* Task Title */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Task Title
            </label>

            <input
              type="text"
              placeholder="Example: Complete Internship Report"
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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


        <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Estimated Duration (Minutes)
        </label>

        <input
        type="number"
        min="5"
        step="5"
        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border-2 border-indigo-500/40 dark:border-indigo-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                autoFocus
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                ✨ This will automatically create a new filter tag on your tasks page.
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
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Buttons */}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-sm sm:text-base transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 font-semibold text-sm sm:text-base transition cursor-pointer shadow-md hover:shadow-indigo-500/25"
            >
              Save Task
            </button>

          </div>

        </form>

      </div>

    </div>,
    document.body
  );
}

export default AddTaskModal;