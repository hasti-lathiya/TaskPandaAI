import { useState } from "react";
import { db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { createPortal } from "react-dom";
import CustomSelect from "../../components/Common/CustomSelect";

function EditTaskModal({
  isOpen,
  onClose,
  task,
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [category, setCategory] = useState(task?.category || "Other");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [estimatedDuration, setEstimatedDuration] = useState(task?.estimatedDuration || 30);
  const [energyLevel, setEnergyLevel] = useState(task?.energyLevel || "Medium");
  const [description, setDescription] = useState(task?.description || "");

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
        description,
        category,
        priority,
        dueDate,
        estimatedDuration: Number(estimatedDuration),
        energyLevel,
      });

      alert("✅ Task Updated Successfully!");

      onClose();

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;  return createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
      {/* Backdrop dark overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-md z-40" 
        onClick={onClose} 
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 w-full max-w-lg shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300 z-50 box-border">

        {/* Header */}

        <div className="flex justify-between items-center mb-8 flex-shrink-0">

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

        <div className="space-y-5 flex-grow overflow-y-auto pr-2 scrollbar-thin text-left">

          {/* Description */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>

            <textarea
              rows="3"
              placeholder="Describe the task..."
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
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
              buttonClassName="!rounded-2xl !p-4"
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
              buttonClassName="!rounded-2xl !p-4"
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
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
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
              onChange={(val) => setCategory(val)}
              options={["College", "Internship", "Personal", "Other"]}
              buttonClassName="!rounded-2xl !p-4"
            />
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

        <div className="flex justify-end gap-4 mt-8 flex-shrink-0">

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

    </div>,
    document.body
  );
}

export default EditTaskModal;