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
    <div className="glass-premium rounded-[24px] p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-slate-100 tracking-tight">
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
          className="bg-white dark:bg-[#0c1222] text-slate-800 dark:text-slate-105 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 w-40 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-bold transition shadow-inner"
        />

        <button
          onClick={saveHours}
          className="bg-emerald-605 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl transition cursor-pointer font-bold text-sm flex items-center justify-center shadow-sm hover:shadow-emerald-500/10 active:scale-95"
        >
          Save
        </button>

      </div>

    </div>
  );
}

export default HoursTracker;