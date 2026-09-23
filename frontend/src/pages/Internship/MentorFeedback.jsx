import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function MentorFeedback() {
  const [feedback, setFeedback] = useState("");

  const loadFeedback = async () => {
    try {
      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);

      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setFeedback(snap.data().mentorFeedback || "");
      }

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadFeedback();
      }
    });

    return () => unsubscribe();
  }, []);

  const saveFeedback = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      await updateDoc(userRef, {
        mentorFeedback: feedback,
      });

      alert("✅ Feedback Saved");

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 transition-colors duration-300">

      <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-800 dark:text-slate-100">
        ⭐ Mentor Feedback
      </h2>

      <textarea
        rows="3"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write mentor feedback here..."
        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 resize-none text-xs sm:text-sm"
      />

      <button
        onClick={saveFeedback}
        className="mt-3 sm:mt-4 w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition cursor-pointer font-semibold text-xs sm:text-sm shadow-sm"
      >
        Save Feedback
      </button>

    </div>
  );
}

export default MentorFeedback;