import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function HoursTracker({ todayHours, setTodayHours}) {
  const [hours, setHours] = useState(todayHours);

  useEffect(() => {
    const loadHours = async () => {
      try {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const savedHours = userSnap.data().todayHours || 0;
          setHours(savedHours);
          setTodayHours(savedHours);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadHours();
      }
    });

    return () => unsubscribe();
  }, [setTodayHours]);

  // Save Hours
  const saveHours = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      const today = new Date();

    await updateDoc(userRef, {
    todayHours: Number(hours),
    lastUpdatedDay: today.toLocaleDateString("en-US", {
    weekday: "short",
    }),
    lastUpdatedDate: today.toISOString().split("T")[0],
    });
    setTodayHours(Number(hours));
      alert("✅ Hours Saved!");

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 mt-8 transition-colors duration-300">

      <h2 className="text-2xl font-bold mb-5 text-slate-800 dark:text-slate-100">
        ⏰ Hours Tracker
      </h2>

      <div className="flex gap-4">

        <input
          type="number"
          min="0"
          max="8"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours Worked"
          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 w-40 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={saveHours}
          className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-6 rounded-xl transition cursor-pointer font-medium"
        >
          Save
        </button>

      </div>

    </div>
  );
}

export default HoursTracker;