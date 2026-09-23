import { useState } from "react";
import { db, auth } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNotifications } from "../../context/NotificationContext";
import { createPortal } from "react-dom";
import CustomSelect from "../../components/Common/CustomSelect";

function AddTaskModal({ isOpen, onClose }) {
const { addNotification } = useNotifications();
const [title, setTitle] = useState("");
const [priority, setPriority] = useState("Medium");
const [dueDate, setDueDate] = useState("");
const [category, setCategory] = useState("College");

const [estimatedDuration, setEstimatedDuration] = useState(30);
const [energyLevel, setEnergyLevel] = useState("Medium");
const [description, setDescription] = useState("");


  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      alert("Task title must be at least 3 characters long.");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
      title,
      description,
      category,
      priority,
      dueDate,
      estimatedDuration,
      energyLevel,
      completed: false,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

      await addNotification("Task Created 🎯", `Task Created: ${title}`, "task");

      setTitle("");
      setPriority("Medium");
      setDueDate("");
      setCategory("College");
      setEstimatedDuration(30);
      setEnergyLevel("Medium");
      setDescription("");

      onClose();

    } catch (error) {
      alert(error.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-4">

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-8 w-full max-w-lg shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">

        {/* Header */}

        <div className="flex justify-between items-center mb-8 flex-shrink-0">

          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              ➕ Add New Task
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Create a task and keep your productivity moving.
            </p>
          </div>

          <div className="text-5xl">
            🐼
          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 flex-grow overflow-y-auto pr-2 scrollbar-thin"
        >

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


          {/* Task Title */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Task Title
            </label>

            <input
              type="text"
              placeholder="Example: Complete Internship Report"
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
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
              buttonClassName="!rounded-2xl !p-4"
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
            buttonClassName="!rounded-2xl !p-4"
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
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-4 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer"
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