import { db } from "../firebase/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * Atomically grants XP and/or coins to a user's Firestore profile.
 * Reuses the same users/{uid} xp+coins fields as task completion
 * (see Tasks.jsx completeTask) instead of a separate reward system.
 *
 * No duplicate-protection here by design — every caller of this
 * function represents an inherently one-off event (e.g. a single PDF
 * upload). Rewards that can be re-triggered by the same user action
 * (achievement unlocks, weekly streak bonus, internship reports) must
 * use awardXpOnce below instead.
 */
export async function awardXp(userId, { xp = 0, coins = 0 } = {}) {
  if (!userId) return;
  if (xp === 0 && coins === 0) return;

  const userRef = doc(db, "users", userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const newXP = (userData.xp || 0) + xp;
    const newCoins = (userData.coins || 0) + coins;

    transaction.update(userRef, {
      xp: newXP,
      coins: newCoins,
      level: Math.floor(newXP / 100) + 1,
    });
  });
}

/**
 * Same as awardXp, but guarantees the reward is granted at most once
 * per `uniqueRewardId`, backed by a Firestore transaction rather than
 * React state — safe against refreshes, re-renders, double-clicks, and
 * concurrent calls from different pages.
 *
 * Used for: weekly streak bonus, internship report bonus, and
 * achievement unlock rewards.
 */
export async function awardXpOnce(userId, { xp = 0, coins = 0, reason = "", uniqueRewardId }) {
  if (!userId) return { awarded: false };
  if (!uniqueRewardId) {
    throw new Error("awardXpOnce requires a uniqueRewardId to prevent duplicate rewards.");
  }
  if (xp === 0 && coins === 0) return { awarded: false };

  const userRef = doc(db, "users", userId);
  const claimRef = doc(db, "users", userId, "rewardClaims", uniqueRewardId);

  let awarded = false;

  await runTransaction(db, async (transaction) => {
    const claimSnap = await transaction.get(claimRef);
    if (claimSnap.exists()) {
      return; // Already claimed — no-op, prevents duplicate reward.
    }

    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const newXP = (userData.xp || 0) + xp;
    const newCoins = (userData.coins || 0) + coins;

    transaction.update(userRef, {
      xp: newXP,
      coins: newCoins,
      level: Math.floor(newXP / 100) + 1,
    });

    transaction.set(claimRef, {
      reason,
      xp,
      coins,
      claimedAt: serverTimestamp(),
    });

    awarded = true;
  });

  return { awarded };
}

/** ISO year-week identifier, e.g. "2026-W33". Used to cap the weekly
 * internship report bonus to once per calendar week regardless of how
 * many times the report is regenerated that week. */
export function getISOWeekString(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
