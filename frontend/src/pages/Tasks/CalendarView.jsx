import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarView({ tasks }) {
  const [date, setDate] = useState(new Date());

  const selectedDateTasks = tasks.filter(
    (task) =>
      task.dueDate ===
      date.toISOString().split("T")[0]
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mt-6 sm:mt-8 transition-colors duration-300 text-slate-800 dark:text-slate-100 overflow-hidden">

      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800 dark:text-slate-100">
        📅 Task Calendar
      </h2>

      <div className="w-full overflow-x-auto pb-1">
        <Calendar
          onChange={setDate}
          value={date}
          className="w-full border-none rounded-2xl dark:bg-slate-900 dark:text-slate-100"
          tileContent={({ date, view }) => {
            if (view === "month") {
              const taskExists = tasks.some(
                (task) =>
                  task.dueDate ===
                  date.toISOString().split("T")[0]
              );

              return taskExists ? (
                <div className="text-center text-red-500 text-lg">
                  📌
                </div>
              ) : null;
            }
          }}
        />
      </div>

      <div className="mt-8">

        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
          Tasks for {date.toDateString()}
        </h3>

        {selectedDateTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">
            No tasks on this date.
          </p>
        ) : (
          <div className="space-y-3">

            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className="bg-indigo-50 dark:bg-slate-800 rounded-xl p-4 border border-transparent dark:border-slate-700/60"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {task.title}
                </p>

                <p className="text-gray-500 dark:text-slate-400 text-sm">
                  {task.priority} Priority • {task.category}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default CalendarView;