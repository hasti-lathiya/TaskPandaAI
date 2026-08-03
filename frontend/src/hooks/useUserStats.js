import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function useUserStats() {
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
    loading: true,
  });

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);

        try {
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
          }

          unsubscribeSnapshot = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserStats({
                ...snapshot.data(),
                loading: false,
              });
            }
          });
        } catch (err) {
          console.error("Error setting up user stats listener:", err);
          setUserStats(prev => ({ ...prev, loading: false }));
        }
      } else {
        setUserStats({
          xp: 0,
          level: 1,
          coins: 0,
          streak: 0,
          loading: false,
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

  return userStats;
}

export default useUserStats;