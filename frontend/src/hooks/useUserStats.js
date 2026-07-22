import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function useUserStats() {
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
        fullName: user.displayName || "",
        email: user.email,

        xp: 0,
        level: 1,
        coins: 0,
        streak: 0,

        lastCompletedDate: "",
        });

        setUserStats({
          xp: 0,
          level: 1,
          coins: 0,
          streak: 0,
        });

      } else {
        setUserStats(userSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  return userStats;
}

export default useUserStats;