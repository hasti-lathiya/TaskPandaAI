import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("app_user");
    return saved ? JSON.parse(saved) : { fullName: "HASTI LATHIYA", email: "hasti@student.edu", role: "Computer Science Student", major: "Software Engineering", bio: "Active productivity companion grower and student." };
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("app_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem("app_coins");
    return saved ? Number(saved) : 1250;
  });

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("app_streak");
    return saved ? Number(saved) : 7;
  });

  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("app_xp");
    return saved ? Number(saved) : 1240;
  });

  const [studyHours, setStudyHours] = useState(() => {
    const saved = localStorage.getItem("app_study_hours");
    return saved ? Number(saved) : 48;
  });

  const [equippedCompanion, setEquippedCompanion] = useState(() => {
    return localStorage.getItem("equippedCompanion") || "Cat";
  });

  const [loading, setLoading] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("app_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("app_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("app_coins", coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("app_streak", streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem("app_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("app_study_hours", studyHours.toString());
  }, [studyHours]);

  // Firestore Real-Time Syncer
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      // Sync user profile stats
      const userRef = doc(db, "users", firebaseUser.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser({
            fullName: data.fullName || "HASTI LATHIYA",
            email: data.email || firebaseUser.email || "hasti@student.edu",
            role: data.role || "Computer Science Student",
            major: data.major || "Software Engineering",
            bio: data.bio || "Active productivity companion grower and student.",
          });
          setCoins(data.coins !== undefined ? data.coins : 1250);
          setStreak(data.streak !== undefined ? data.streak : 7);
          setXp(data.xp !== undefined ? data.xp : 1240);
          if (data.equippedCompanion) {
            setEquippedCompanion(data.equippedCompanion);
          }
        }
      }, (err) => {
        console.error("Firestore user sync error:", err);
      });

      // Sync user tasks list
      const tasksQuery = query(collection(db, "tasks"), where("userId", "==", firebaseUser.uid));
      const unsubscribeTasks = onSnapshot(tasksQuery, (querySnap) => {
        const list = [];
        querySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setTasks(list);
      }, (err) => {
        console.error("Firestore tasks sync error:", err);
      });

      setLoading(false);

      return () => {
        unsubscribeUser();
        unsubscribeTasks();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const updateProfile = async (updates) => {
    setUser(prev => ({ ...prev, ...updates }));

    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, updates);
      } catch (err) {
        console.error("Failed to update profile in Firestore:", err);
      }
    }
  };

  const completeTask = async () => {
    setCoins(prev => prev + 10000);
    setXp(prev => prev + 1000);

    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const curCoins = userSnap.data().coins || 0;
          const curXp = userSnap.data().xp || 0;
          await updateDoc(userRef, {
            coins: curCoins + 10000,
            xp: curXp + 1000
          });
        }
      } catch (err) {
        console.error("Failed to reward coins in Firestore:", err);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tasks,
        coins,
        streak,
        xp,
        studyHours,
        setStudyHours,
        equippedCompanion,
        setEquippedCompanion,
        updateProfile,
        completeTask,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
