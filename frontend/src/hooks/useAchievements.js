import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { ACHIEVEMENTS, runAchievementChecks } from "../services/achievements";
import { useNotifications } from "../context/NotificationContext";

function mergeAchievements(stateById) {
  return ACHIEVEMENTS.map((def) => {
    const state = stateById.get(def.id);
    return {
      ...def,
      progress: state?.progress ?? 0,
      unlocked: state?.unlocked === true,
      unlockedAt: state?.unlockedAt ?? null,
    };
  });
}

function useAchievements() {
  const { addNotification } = useNotifications();
  const [achievements, setAchievements] = useState(() => mergeAchievements(new Map()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setAchievements(mergeAchievements(new Map()));
        setLoading(false);
        return;
      }

      // Recompute from real data on mount/login so progress and unlocks
      // stay accurate even if nothing changed this session (e.g. covers
      // achievements affected by data changed on another device).
      runAchievementChecks(user.uid, { addNotification }).catch((err) =>
        console.error("Achievement check failed:", err)
      );

      unsubscribeSnapshot = onSnapshot(
        collection(db, "users", user.uid, "achievements"),
        (snapshot) => {
          const stateById = new Map();
          snapshot.forEach((docSnap) => stateById.set(docSnap.id, docSnap.data()));
          setAchievements(mergeAchievements(stateById));
          setLoading(false);
        },
        (err) => {
          console.error("Achievements listener error:", err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return { achievements, loading, unlockedCount, totalCount };
}

export default useAchievements;
