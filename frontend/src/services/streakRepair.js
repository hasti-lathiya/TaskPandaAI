import { db } from "../firebase/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * Streak repair: spend coins to buy back a streak that lapsed.
 *
 * Pricing and window were product decisions:
 *   - 50 coins per day of streak restored, capped at 500 (one task = 50 coins,
 *     so a 3-day streak costs 3 tasks and anything past 10 days costs 10).
 *   - Repairable for GRACE_DAYS after the streak lapsed, then gone for good.
 */

export const COINS_PER_DAY = 50;
export const MAX_REPAIR_COST = 500;
export const GRACE_DAYS = 2;

/** Date key in the same format the rest of the app stores (`lastCompletedDate`). */
export function toDateKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function daysBetween(fromKey, toKey) {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86400000);
}

export function repairCost(streakDays) {
  return Math.min(streakDays * COINS_PER_DAY, MAX_REPAIR_COST);
}

/**
 * Works out whether `userData` has a streak that can currently be bought back.
 *
 * There are two ways a broken streak shows up, and both have to be handled:
 *
 *  1. "pending" — the user lapsed but has not completed anything since, so
 *     `streak` still holds the old value and `lastCompletedDate` is stale.
 *     Nothing has been written yet; the break is inferred from the dates.
 *  2. "recorded" — the user completed a task after lapsing, so completeTask
 *     reset `streak` to 1 and stashed the old value in `brokenStreak` /
 *     `brokenStreakDate` on the way past. Without that stash the previous
 *     streak would be unrecoverable.
 *
 * Returns null when there is nothing to repair.
 */
export function getRepairableStreak(userData, today = toDateKey()) {
  if (!userData) return null;

  const recordedStreak = userData.brokenStreak || 0;
  const recordedDate = userData.brokenStreakDate || "";

  if (recordedStreak > 0 && recordedDate) {
    const elapsed = daysBetween(recordedDate, today);
    // elapsed 1 == the day that was missed; grace runs from there.
    if (elapsed !== null && elapsed <= GRACE_DAYS + 1) {
      return {
        source: "recorded",
        streak: recordedStreak,
        lapsedAfter: recordedDate,
        cost: repairCost(recordedStreak),
      };
    }
    return null;
  }

  const streak = userData.streak || 0;
  const lastCompletedDate = userData.lastCompletedDate || "";
  if (streak <= 0 || !lastCompletedDate) return null;

  const elapsed = daysBetween(lastCompletedDate, today);
  if (elapsed === null || elapsed < 2) return null; // 0 = done today, 1 = still alive
  if (elapsed > GRACE_DAYS + 1) return null;

  return {
    source: "pending",
    streak,
    lapsedAfter: lastCompletedDate,
    cost: repairCost(streak),
  };
}

/**
 * Spends coins to restore a lapsed streak, atomically.
 *
 * Every precondition is re-checked inside the transaction against fresh
 * data — the caller's view of coins/streak may be stale, and this both
 * spends currency and rewrites streak state, so it must not be decided
 * from a snapshot the UI happened to be holding.
 *
 * Resolves to { ok: true, streak, cost } or { ok: false, reason }.
 */
export async function repairStreak(userId, today = toDateKey()) {
  if (!userId) return { ok: false, reason: "NO_USER" };

  const userRef = doc(db, "users", userId);
  let result = { ok: false, reason: "NOTHING_TO_REPAIR" };

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) {
      result = { ok: false, reason: "NO_USER" };
      return;
    }

    const userData = userSnap.data();
    const repairable = getRepairableStreak(userData, today);
    if (!repairable) {
      result = { ok: false, reason: "NOTHING_TO_REPAIR" };
      return;
    }

    const coins = userData.coins || 0;
    if (coins < repairable.cost) {
      result = { ok: false, reason: "INSUFFICIENT_COINS", cost: repairable.cost, coins };
      return;
    }

    // A "recorded" break means today's completion already counted as day 1 of a
    // new streak, so the restored total absorbs it. A "pending" break has no
    // completion since the lapse, so we rewind lastCompletedDate to yesterday
    // and let the next completion carry the streak forward normally.
    let restoredStreak;
    const updates = { coins: coins - repairable.cost };

    if (repairable.source === "recorded") {
      restoredStreak = repairable.streak + 1;
      updates.lastCompletedDate = userData.lastCompletedDate || today;
    } else {
      restoredStreak = repairable.streak;
      const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000);
      updates.lastCompletedDate = toDateKey(yesterday);
    }

    updates.streak = restoredStreak;
    updates.brokenStreak = 0;
    updates.brokenStreakDate = "";
    updates.lastStreakRepairAt = serverTimestamp();

    transaction.update(userRef, updates);
    result = { ok: true, streak: restoredStreak, cost: repairable.cost };
  });

  return result;
}
