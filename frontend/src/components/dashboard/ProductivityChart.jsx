import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { db, auth } from "../../firebase/firebase";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useTheme } from "../../context/ThemeContext";

function ProductivityChart() {
  const { darkMode } = useTheme();
  const [data, setData] = useState([
    { day: "Mon", tasks: 0 },
    { day: "Tue", tasks: 0 },
    { day: "Wed", tasks: 0 },
    { day: "Thu", tasks: 0 },
    { day: "Fri", tasks: 0 },
    { day: "Sat", tasks: 0 },
    { day: "Sun", tasks: 0 },
  ]);

  useEffect(() => {
    const loadChart = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid),
        where("completed", "==", true)
      );

      const snapshot = await getDocs(q);

      const weeklyData = {
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
        Sun: 0,
      };

      snapshot.forEach((doc) => {
        const task = doc.data();

        if (!task.createdAt) return;

        let date;
        try {
          if (task.createdAt && typeof task.createdAt.toDate === "function") {
            date = task.createdAt.toDate();
          } else {
            date = new Date(task.createdAt);
          }
          if (isNaN(date.getTime())) {
            return;
          }
        } catch (e) {
          console.error("Error parsing date: ", e);
          return;
        }

        const day = date.toLocaleDateString("en-US", {
          weekday: "short",
        });

        if (weeklyData[day] !== undefined) {
          weeklyData[day]++;
        }
      });

      setData([
        { day: "Mon", tasks: weeklyData.Mon },
        { day: "Tue", tasks: weeklyData.Tue },
        { day: "Wed", tasks: weeklyData.Wed },
        { day: "Thu", tasks: weeklyData.Thu },
        { day: "Fri", tasks: weeklyData.Fri },
        { day: "Sat", tasks: weeklyData.Sat },
        { day: "Sun", tasks: weeklyData.Sun },
      ]);
    };

    loadChart();
  }, []);

  const totalCompleted = data.reduce(
    (sum, item) => sum + item.tasks,
    0
  );

  const bestDay = [...data].sort(
    (a, b) => b.tasks - a.tasks
  )[0];

  return (
    <div className="glass-premium rounded-[24px] p-8 shadow-sm">

      {/* Header */}

      <div className="flex justify-between items-start mb-8">

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            📊 Productivity Analytics
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your completed tasks during the week
          </p>
        </div>

        <div className="bg-indigo-500/10 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 px-4.5 py-2 rounded-2xl font-bold text-sm border border-indigo-500/10 dark:border-indigo-500/30 shadow-sm">
          {totalCompleted} Completed
        </div>

      </div>

      {/* Chart */}

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? "#334155" : "#E5E7EB"}
          />

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: darkMode ? "#94A3B8" : "#64748B" }}
          />

          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: darkMode ? "#94A3B8" : "#64748B" }}
          />

          <Tooltip
            cursor={{ fill: darkMode ? "#1E293B" : "#F8FAFC" }}
            contentStyle={{
              backgroundColor: darkMode ? "#0F172A" : "#FFFFFF",
              borderRadius: "16px",
              border: darkMode ? "1px solid #334155" : "1px solid #E5E7EB",
              color: darkMode ? "#F8FAFC" : "#0F172A",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          />

          <Bar
            dataKey="tasks"
            fill={darkMode ? "#6366F1" : "#4F46E5"}
            radius={[12, 12, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>

      {/* Footer Stats */}

      <div className="grid grid-cols-2 gap-4 mt-8">

        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-900/30 rounded-[20px] p-4 transition-all duration-300 hover:border-emerald-500/30">

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            🏆 Best Day
          </p>

          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {bestDay ? bestDay.day : "N/A"}
          </h3>

        </div>

        <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 dark:border-amber-900/30 rounded-[20px] p-4 transition-all duration-300 hover:border-amber-500/30">

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ✅ Weekly Total
          </p>

          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalCompleted}
          </h3>

        </div>

      </div>

    </div>
  );
}

export default ProductivityChart;