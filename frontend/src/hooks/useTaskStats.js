import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function useTaskStats() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "tasks"),
          where("userId", "==", user.uid)
        );

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            let total = 0;
            let completed = 0;

            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              total++;
              if (data.completed) {
                completed++;
              }
            });

            const pending = total - completed;
            const completionRate =
              total === 0 ? 0 : Math.round((completed / total) * 100);

            setStats({
              total,
              completed,
              pending,
              completionRate,
            });
          },
          (err) => {
            console.error("Error fetching tasks snapshot: ", err);
          }
        );
      } else {
        setStats({
          total: 0,
          completed: 0,
          pending: 0,
          completionRate: 0,
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return stats;
}

export default useTaskStats;