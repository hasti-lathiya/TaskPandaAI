import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function useTaskStats() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  const loadStats = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    let total = 0;
    let completed = 0;

    snapshot.forEach((doc) => {
      total++;

      if (doc.data().completed) {
        completed++;
      }
    });

    const pending = total - completed;

    const completionRate =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    setStats({
      total,
      completed,
      pending,
      completionRate,
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadStats();
      }
    });

    return unsubscribe;
  }, []);

  return stats;
}

export default useTaskStats;