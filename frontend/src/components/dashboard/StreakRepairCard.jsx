import { useState } from "react";
import { Flame, Coins, AlertTriangle } from "lucide-react";
import { auth } from "../../firebase/firebase";
import { useNotifications } from "../../context/NotificationContext";
import { getRepairableStreak, repairStreak, GRACE_DAYS } from "../../services/streakRepair";

/**
 * Offers to sell a lapsed streak back to the user for coins.
 *
 * Renders nothing unless there is actually a streak inside its repair
 * window, so it can be dropped into a page unconditionally.
 */
function StreakRepairCard({ userStats }) {
  const { addNotification } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const repairable = userStats?.loading ? null : getRepairableStreak(userStats);
  if (!repairable) return null;

  const coins = userStats?.coins || 0;
  const affordable = coins >= repairable.cost;

  const handleRepair = async () => {
    if (busy || !affordable) return;
    setBusy(true);
    setError("");

    try {
      const result = await repairStreak(auth.currentUser?.uid);

      if (result.ok) {
        await addNotification(
          "Streak Restored! 🔥",
          `Your ${result.streak}-day streak is back. Spent ${result.cost} coins.`,
          "gamification"
        );
      } else if (result.reason === "INSUFFICIENT_COINS") {
        setError(`You need ${result.cost} coins — you have ${result.coins}.`);
      } else if (result.reason === "NOTHING_TO_REPAIR") {
        setError("This streak can no longer be restored.");
      } else {
        setError("Could not restore your streak. Please try again.");
      }
    } catch (err) {
      console.error("Streak repair failed:", err);
      setError("Could not restore your streak. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-xl border border-amber-300/60 dark:border-amber-500/30 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden shadow-sm shadow-amber-500/5">
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 dark:bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center border border-amber-400/20">
            <Flame className="text-amber-500" size={24} />
          </div>

          <div>
            <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              Your {repairable.streak}-day streak broke
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1 max-w-md">
              You last completed a task on {repairable.lapsedAfter}. Spend coins to
              pick up where you left off — available for {GRACE_DAYS} more{" "}
              {GRACE_DAYS === 1 ? "day" : "days"}.
            </p>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mt-2">
                <AlertTriangle size={14} />
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-500/10">
          <div className="text-left sm:text-right">
            <div className="flex items-center gap-1 text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-50">
              <Coins className="text-amber-500" size={18} />
              {repairable.cost}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              You have {coins}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRepair}
            disabled={busy || !affordable}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl transition cursor-pointer whitespace-nowrap shadow-sm"
          >
            {busy ? "Restoring..." : affordable ? "Restore streak" : "Need coins"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StreakRepairCard;
