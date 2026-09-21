import { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { auth, db } from "../../firebase/firebase";
import { doc, runTransaction } from "firebase/firestore";
import useUserStats from "../../hooks/useUserStats";
import { useNotifications } from "../../context/NotificationContext";

// Evolution is driven by level; mood is driven by streak. Both feed the hero
// card, so levelling up visibly changes the panda instead of only changing a
// number on screen.
const EVOLUTION_STAGES = [
  { name: "Baby Panda", emoji: "🐼", minLevel: 1, maxLevel: 4, label: "Level 1-4" },
  { name: "Student Panda", emoji: "🎓🐼", minLevel: 5, maxLevel: 9, label: "Level 5-9" },
  { name: "Ninja Panda", emoji: "🥷🐼", minLevel: 10, maxLevel: 19, label: "Level 10-19" },
  { name: "King Panda", emoji: "👑🐼", minLevel: 20, maxLevel: Infinity, label: "Level 20+" },
];

const SHOP_ITEMS = [
  { name: "Panda Hat", emoji: "🎩", price: 50 },
  { name: "Panda Glasses", emoji: "🕶️", price: 100 },
  { name: "Panda Backpack", emoji: "🎒", price: 150 },
  { name: "Panda Crown", emoji: "👑", price: 200 },
];

const MOODS = [
  { minStreak: 15, mood: "Legend Panda", message: "You're unstoppable! Keep going!" },
  { minStreak: 7, mood: "Happy Panda", message: "Amazing consistency!" },
  { minStreak: 3, mood: "Motivated Panda", message: "You're building momentum!" },
  { minStreak: 0, mood: "Sleepy Panda", message: "Complete tasks to wake me up!" },
];

const getEvolutionStage = (level) =>
  EVOLUTION_STAGES.find((s) => level >= s.minLevel && level <= s.maxLevel) ||
  EVOLUTION_STAGES[0];

const getMood = (streak) => MOODS.find((m) => streak >= m.minStreak) || MOODS[MOODS.length - 1];

// Firestore can hand back a missing or non-numeric field; coercing here keeps a
// bad value from propagating into arithmetic and being written back as NaN.
const toSafeNumber = (value, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function Panda() {
  const userStats = useUserStats();
  const { addNotification } = useNotifications();

  // Name of the item currently being bought or equipped, used to block a
  // second click landing before the first write resolves.
  const [pendingItem, setPendingItem] = useState(null);
  const [error, setError] = useState("");

  const loading = userStats.loading;
  const xp = toSafeNumber(userStats.xp);
  const coins = toSafeNumber(userStats.coins);
  const level = toSafeNumber(userStats.level, 1);
  const streak = toSafeNumber(userStats.streak);
  const ownedItems = userStats.ownedItems || [];
  const equippedItem = userStats.equippedItem || "";

  const progress = xp % 100;
  const stage = getEvolutionStage(level);
  const mood = getMood(streak);
  const equippedEmoji =
    SHOP_ITEMS.find((item) => item.name === equippedItem)?.emoji || "";

  const buyItem = async (item) => {
    if (pendingItem) return;

    setError("");
    setPendingItem(item.name);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      // Read-modify-write in one transaction: reading the balance from local
      // state instead would let two quick clicks both spend the same coins.
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error("NO_USER");

        const data = snap.data();
        const owned = data.ownedItems || [];
        if (owned.includes(item.name)) throw new Error("ALREADY_OWNED");

        const currentCoins = toSafeNumber(data.coins);
        if (currentCoins < item.price) throw new Error("INSUFFICIENT_COINS");

        transaction.update(userRef, {
          coins: currentCoins - item.price,
          ownedItems: [...owned, item.name],
        });
      });

      await addNotification(
        "Item Purchased! 🛍️",
        `${item.name} is yours. Spent ${item.price} coins.`,
        "gamification"
      );
    } catch (err) {
      if (err.message === "ALREADY_OWNED") {
        setError("You already own this item.");
      } else if (err.message === "INSUFFICIENT_COINS") {
        setError("Not enough coins for that item yet.");
      } else {
        console.error("Purchase failed:", err);
        setError("Purchase failed. Please try again.");
      }
    } finally {
      setPendingItem(null);
    }
  };

  const equipItem = async (item) => {
    if (pendingItem) return;

    setError("");
    setPendingItem(item.name);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error("NO_USER");

        // Re-check ownership against stored data rather than trusting the
        // rendered list, which may be a snapshot behind.
        const owned = snap.data().ownedItems || [];
        if (!owned.includes(item.name)) throw new Error("NOT_OWNED");

        transaction.update(userRef, { equippedItem: item.name });
      });
    } catch (err) {
      if (err.message === "NOT_OWNED") {
        setError("You need to buy that item first.");
      } else {
        console.error("Equip failed:", err);
        setError("Could not equip that item. Please try again.");
      }
    } finally {
      setPendingItem(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="h-36 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          🐼 Panda Pet
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mt-2">
          Your AI productivity companion.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 font-bold text-sm text-center shadow-sm"
        >
          {error}
        </div>
      )}

      {/* Panda Hero Card */}

      <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-3xl p-10 text-white shadow-xl mb-8">

        <div className="text-center">

          <div className="text-9xl mb-4">
            {equippedEmoji}
            {stage.emoji}
          </div>

          <h2 className="text-4xl font-bold">
            {stage.name}
          </h2>

          <p className="mt-3 text-lg font-semibold">
            {mood.mood}
          </p>

          <p className="mt-1 text-lg opacity-90">
            {mood.message}
          </p>

        </div>

      </div>

      {/* Stats */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            🏆 Level
          </p>

          <h2 className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mt-3">
            {level}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            ⭐ XP
          </p>

          <h2 className="text-5xl font-bold text-yellow-500 dark:text-amber-400 mt-3">
            {xp}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            🪙 Coins
          </p>

          <h2 className="text-5xl font-bold text-orange-500 dark:text-orange-400 mt-3">
            {coins}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            🔥 Streak
          </p>

          <h2 className="text-5xl font-bold text-red-500 dark:text-red-400 mt-3">
            {streak}
          </h2>
        </div>

      </div>

      {/* XP Progress */}

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-8 mt-8 transition-colors duration-300">

        <div className="flex justify-between mb-3">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            📈 XP Progress
          </h2>

          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {progress}% to next level
          </span>
        </div>

        <div
          className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-6 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to next level"
        >

          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-6 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <p className="mt-4 text-gray-500 dark:text-slate-400">
          Complete tasks to earn XP and level up your Panda.
        </p>

      </div>

      {/* Level System */}

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-8 mt-8 transition-colors duration-300">

        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          🐼 Panda Evolution
        </h2>

        <div className="grid md:grid-cols-4 gap-6 text-center">

          {EVOLUTION_STAGES.map((evolution) => {
            const isCurrent = evolution.name === stage.name;

            return (
              <div
                key={evolution.name}
                aria-current={isCurrent ? "true" : undefined}
                className={`rounded-2xl p-5 border transition-colors duration-300 ${
                  isCurrent
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm shadow-indigo-500/10"
                    : "bg-gray-100 dark:bg-slate-800 border-transparent dark:border-slate-700/50"
                }`}
              >
                <div className="text-5xl">{evolution.emoji}</div>

                <p className="font-bold mt-3 text-slate-800 dark:text-slate-100">
                  {evolution.name}
                </p>

                <p className="text-gray-500 dark:text-slate-400">
                  {evolution.label}
                </p>

                {isCurrent && (
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Current stage
                  </p>
                )}
              </div>
            );
          })}

        </div>

      </div>

      {/* Panda Shop */}

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-8 mt-8 transition-colors duration-300">

        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          🛒 Panda Shop
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

          {SHOP_ITEMS.map((item) => {
            const owned = ownedItems.includes(item.name);
            const isEquipped = equippedItem === item.name;
            const isPending = pendingItem === item.name;
            const affordable = coins >= item.price;

            return (
              <div
                key={item.name}
                className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-6 text-center border border-transparent dark:border-slate-700/50"
              >

                <div className="text-6xl mb-4">
                  {item.emoji}
                </div>

                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">
                  {item.name}
                </h3>

                <p className="text-orange-500 dark:text-amber-400 mt-2 font-semibold">
                  🪙 {item.price}
                </p>

                {owned ? (
                  <button
                    onClick={() => equipItem(item)}
                    disabled={isEquipped || Boolean(pendingItem)}
                    aria-busy={isPending}
                    className={`mt-4 px-4 py-2 rounded-xl text-white font-medium transition cursor-pointer disabled:cursor-not-allowed ${
                      isEquipped
                        ? "bg-green-500 dark:bg-green-600 disabled:opacity-100"
                        : "bg-orange-500 dark:bg-amber-600 hover:bg-orange-600 dark:hover:bg-amber-700 disabled:opacity-60"
                    }`}
                  >
                    {isEquipped ? "Equipped ✅" : isPending ? "Equipping..." : "Equip"}
                  </button>
                ) : (
                  <button
                    onClick={() => buyItem(item)}
                    disabled={Boolean(pendingItem) || !affordable}
                    aria-busy={isPending}
                    title={affordable ? undefined : "Not enough coins yet"}
                    className="mt-4 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Buying..." : "Buy"}
                  </button>
                )}

              </div>
            );
          })}

        </div>

      </div>

    </MainLayout>
  );
}

export default Panda;
