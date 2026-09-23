import { useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { doc, updateDoc } from "firebase/firestore";

const MAX_DAILY_HOURS = 8;

function HoursTracker({ todayHours, setTodayHours }) {
  const [hours, setHours] = useState(todayHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // The parent already holds a live subscription to this value (and resets it
  // at the day boundary), so follow it rather than issuing a second read that
  // would drift out of step with it. Adjusting during render (rather than in an
  // effect) avoids rendering one frame with the stale value.
  const [syncedHours, setSyncedHours] = useState(todayHours);

  if (todayHours !== syncedHours) {
    setSyncedHours(todayHours);
    setHours(todayHours);
  }

  // Save Hours
  const saveHours = async () => {
    if (saving) return;

    const parsed = Number(hours);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_DAILY_HOURS) {
      setError(`Enter a number between 0 and ${MAX_DAILY_HOURS}.`);
      return;
    }

    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      const today = new Date();

      await updateDoc(userRef, {
        todayHours: parsed,
        lastUpdatedDay: today.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        // Read back by the parent to decide whether these hours are still
        // "today's" — without it a stale total lingers across days.
        lastUpdatedDate: today.toISOString().split("T")[0],
      });

      setTodayHours(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Could not save hours:", err);
      setError("Could not save your hours. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-premium rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">

      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-slate-800 dark:text-slate-100 tracking-tight">
        ⏰ Hours Tracker
      </h2>

      <label htmlFor="today-hours" className="sr-only">
        Hours worked today (0 to {MAX_DAILY_HOURS})
      </label>

      <div className="flex gap-2.5 sm:gap-4">

        <input
          id="today-hours"
          type="number"
          min="0"
          max={MAX_DAILY_HOURS}
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          aria-invalid={Boolean(error)}
          placeholder="Hours Worked"
          className="flex-1 sm:w-40 sm:flex-initial bg-white dark:bg-[#0c1222] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm font-bold transition shadow-inner"
        />

        <button
          onClick={saveHours}
          disabled={saving}
          aria-busy={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl transition cursor-pointer font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm hover:shadow-emerald-500/10 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>

      </div>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {saved && !error && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
        >
          ✅ Hours saved.
        </p>
      )}

    </div>
  );
}

export default HoursTracker;
