import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function DailyWorkLog() {
  const [works, setWorks] = useState([]);
  const [work, setWork] = useState("");

  // Load Work Logs
  const loadWorks = async () => {
    try {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "internshipLogs"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const workList = [];

      snapshot.forEach((doc) => {
        workList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort in-memory by createdAt descending
      workList.sort((a, b) => {
        const valA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
        const valB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
        return valB - valA;
      });

      setWorks(workList);

    } catch (error) {
      console.log(error);
    }
  };

  // Load on page open
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
    loadWorks();
      }
    });

    return ()=> unsubscribe();
  }, []);

  // Add Work
  const addWork = async () => {
    if (work.trim() === "") return;

    try {
      await addDoc(collection(db, "internshipLogs"), {
        title: work,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setWork("");

      loadWorks();

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <div className="glass-premium rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">

      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-4">

        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          📝 Daily Work Log
        </h2>

        <button
          onClick={addWork}
          className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs sm:text-sm px-3.5 sm:px-5 py-2 rounded-xl transition cursor-pointer font-semibold shadow-sm"
        >
          + Add Work
        </button>

      </div>

      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">

        <input
          type="text"
          placeholder="What did you work on today?"
          value={work}
          onChange={(e) => setWork(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addWork();
            }
          }}
          className="flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />

      </div>

      {works.length === 0 ? (

        <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
          No work logged today.
        </div>

      ) : (

        <div className="space-y-2.5 sm:space-y-3">

          {works.map((item) => (

            <div
              key={item.id}
              className="bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex justify-between items-center"
            >

              <span className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-100 break-words">
                ✅ {item.title}
              </span>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default DailyWorkLog;