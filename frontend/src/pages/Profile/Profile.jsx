import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import MainLayout from "../../layouts/MainLayout";

import { auth, db } from "../../firebase/firebase";

import { doc, getDoc } from "firebase/firestore";

function Profile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        console.log(err);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userData) {
    return (
      <MainLayout>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Loading Profile...
        </h1>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-xl p-8 transition-colors duration-300">

        <div className="flex items-center gap-6">

          <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-5xl text-white">
            🐼
          </div>

          <div>

            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              {userData.fullName}
            </h1>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              {userData.email}
            </p>

          </div>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">

          <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl p-5 border border-transparent dark:border-indigo-900/40">
            <p className="text-gray-500 dark:text-slate-400">⭐ XP</p>
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{userData.xp}</h2>
          </div>

          <div className="bg-green-50 dark:bg-green-950/50 rounded-2xl p-5 border border-transparent dark:border-green-900/40">
            <p className="text-gray-500 dark:text-slate-400">🏆 Level</p>
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{userData.level}</h2>
          </div>

          <div className="bg-yellow-50 dark:bg-amber-950/50 rounded-2xl p-5 border border-transparent dark:border-amber-900/40">
            <p className="text-gray-500 dark:text-slate-400">💰 Coins</p>
            <h2 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{userData.coins}</h2>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/50 rounded-2xl p-5 border border-transparent dark:border-orange-900/40">
            <p className="text-gray-500 dark:text-slate-400">🔥 Streak</p>
            <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userData.streak}</h2>
          </div>

        </div>

      </div>

    </MainLayout>
  );
}

export default Profile;