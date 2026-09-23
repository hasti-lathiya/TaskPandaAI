import { useEffect, useState, useMemo } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, BedDouble, Play, CheckCircle, Heart, Zap, Award } from "lucide-react";
import { db, auth } from "../../firebase/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import MainLayout from "../../layouts/MainLayout";
import { ANIMALS, RARITY_BADGES, TIER_BADGES } from "../../data/companions";
import useUserStats from "../../hooks/useUserStats";

const RARITY_FILTERS = ["All", "Common", "Rare", "Epic", "Legendary"];

const DEFAULT_HAPPINESS = 80;
const DEFAULT_ENERGY = 70;

// Firestore can return a missing or non-numeric field; coercing here stops a
// bad value reaching arithmetic and being written back as NaN.
const toSafeNumber = (value, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clampStat = (value) => Math.max(0, Math.min(100, Math.round(value)));

function Companion() {
  const { equippedCompanion, changeCompanion } = useTheme();
  const { addNotification } = useNotifications();

  const userStats = useUserStats();
  const loading = userStats.loading;

  const coins = toSafeNumber(userStats.coins);
  const ownedCompanions = userStats.ownedCompanions || ["Panda"];

  // Happiness/energy live on the user document so they survive a refresh
  // instead of resetting to a hardcoded default on every mount.
  const happiness = toSafeNumber(userStats.companionHappiness, DEFAULT_HAPPINESS);
  const energy = toSafeNumber(userStats.companionEnergy, DEFAULT_ENERGY);

  // Companion Interactive Stats
  const [companionMood, setCompanionMood] = useState("idle"); // idle, playing, happy, sleeping, eating, trick
  const [pendingAnimal, setPendingAnimal] = useState(null);
  const [error, setError] = useState("");

  // Marketplace filter
  const [rarityFilter, setRarityFilter] = useState("All");

  const animals = useMemo(() => ANIMALS, []);

  // Keep the theme's companion in step with whatever the user document says.
  useEffect(() => {
    if (userStats.equippedCompanion) {
      changeCompanion(userStats.equippedCompanion);
    }
  }, [userStats.equippedCompanion, changeCompanion]);

  // Compute status text dynamically
  const currentAnimal = useMemo(() => {
    return animals.find(a => a.name === equippedCompanion) || animals[0];
  }, [animals, equippedCompanion]);

  const statusText = `${currentAnimal.name} ${currentAnimal.behaviors[companionMood]}`;

  // Handle purchasing workflow
  const handlePurchase = async (animal) => {
    if (pendingAnimal || ownedCompanions.includes(animal.name)) return;

    setError("");
    setPendingAnimal(animal.name);

    try {
      const current = auth.currentUser;
      if (!current) return;

      const userRef = doc(db, "users", current.uid);

      // Balance is read inside the transaction; reading it from rendered state
      // would let two quick clicks spend the same coins twice.
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error("NO_USER");

        const data = snap.data();
        const owned = data.ownedCompanions || ["Panda"];
        if (owned.includes(animal.name)) throw new Error("ALREADY_OWNED");

        const currentCoins = toSafeNumber(data.coins);
        if (currentCoins < animal.price) throw new Error("INSUFFICIENT_COINS");

        transaction.update(userRef, {
          coins: currentCoins - animal.price,
          ownedCompanions: [...owned, animal.name],
        });
      });

      await addNotification(
        "Companion Unlocked! 🎉",
        `${animal.name} joined your collection. Spent ${animal.price} coins.`,
        "gamification"
      );
    } catch (err) {
      if (err.message === "ALREADY_OWNED") {
        setError("You already own that companion.");
      } else if (err.message === "INSUFFICIENT_COINS") {
        setError("Not enough coins yet — complete more tasks to earn some. 🪙");
      } else {
        console.error("Error buying companion:", err);
        setError("Purchase failed. Please try again.");
      }
    } finally {
      setPendingAnimal(null);
    }
  };

  // Handle activation/equip workflow
  const handleEquip = async (animalName) => {
    if (pendingAnimal) return;

    setError("");
    setPendingAnimal(animalName);

    try {
      const current = auth.currentUser;
      if (!current) return;

      const userRef = doc(db, "users", current.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) throw new Error("NO_USER");

        // Check ownership against stored data rather than the rendered list.
        const owned = snap.data().ownedCompanions || ["Panda"];
        if (!owned.includes(animalName)) throw new Error("NOT_OWNED");

        transaction.update(userRef, {
          equippedCompanion: animalName,
          companionHappiness: 85,
          companionEnergy: 75,
        });
      });

      changeCompanion(animalName);
      await addNotification("Companion Equipped! 🐾", `Equipped ${animalName} theme!`, "system");
      setCompanionMood("idle");
    } catch (err) {
      if (err.message === "NOT_OWNED") {
        setError("You need to unlock that companion first.");
      } else {
        console.error("Error equipping companion:", err);
        setError("Could not equip that companion. Please try again.");
      }
    } finally {
      setPendingAnimal(null);
    }
  };

  // Persist a happiness/energy change. Applying the delta inside a transaction
  // keeps rapid clicks from each overwriting the other's result.
  const applyCompanionStats = async ({ happinessDelta = 0, energyDelta = 0 }) => {
    const current = auth.currentUser;
    if (!current) return;

    try {
      const userRef = doc(db, "users", current.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        if (!snap.exists()) return;

        const data = snap.data();

        transaction.update(userRef, {
          companionHappiness: clampStat(
            toSafeNumber(data.companionHappiness, DEFAULT_HAPPINESS) + happinessDelta
          ),
          companionEnergy: clampStat(
            toSafeNumber(data.companionEnergy, DEFAULT_ENERGY) + energyDelta
          ),
        });
      });
    } catch (err) {
      console.error("Could not save companion stats:", err);
    }
  };

  // Interaction triggers (play, feed, sleep, trick)
  const runInteraction = ({ mood, duration, happinessDelta = 0, energyDelta = 0 }) => {
    setError("");
    setCompanionMood(mood);
    applyCompanionStats({ happinessDelta, energyDelta });
    setTimeout(() => setCompanionMood("idle"), duration);
  };

  const triggerPlay = () => {
    if (energy < 15) {
      setError(`${equippedCompanion} is too tired to play — try a nap first. 💤`);
      return;
    }
    runInteraction({ mood: "playing", duration: 2500, happinessDelta: 15, energyDelta: -10 });
  };

  const triggerFeed = () =>
    runInteraction({ mood: "eating", duration: 2000, happinessDelta: 5, energyDelta: 20 });

  const triggerNap = () =>
    runInteraction({ mood: "sleeping", duration: 5000, energyDelta: 30 });

  const triggerTrick = () => {
    if (energy < 25) {
      setError(`${equippedCompanion} doesn't have enough energy for a trick. ⚡`);
      return;
    }
    runInteraction({ mood: "trick", duration: 3000, happinessDelta: 20, energyDelta: -20 });
  };

  const triggerPet = () =>
    runInteraction({ mood: "happy", duration: 3000, happinessDelta: 10 });

  // Animation variants mapping based on mood
  const getAvatarAnimation = () => {
    switch (companionMood) {
      case "playing":
        if (equippedCompanion === "Dolphin") {
          // Dolphin swimming leap hoop
          return {
            x: [-60, 0, 60, 0, -60],
            y: [0, -45, 0, -20, 0],
            rotate: [0, 45, 90, 45, 0],
            transition: { duration: 1.5, ease: "easeInOut" }
          };
        }
        if (equippedCompanion === "Rabbit") {
          // Bunny hops
          return {
            y: [0, -30, 0, -30, 0, -30, 0],
            x: [0, 15, 30, 15, 0, -15, 0],
            transition: { duration: 1.6, ease: "easeOut" }
          };
        }
        return {
          y: [0, -25, 0, -20, 0],
          rotate: [0, 15, -15, 10, 0],
          transition: { duration: 1.2, ease: "easeInOut" }
        };
      case "happy":
        return {
          scale: [1, 1.2, 0.95, 1.1, 1],
          y: [0, -15, 0],
          transition: { duration: 1, ease: "easeOut" }
        };
      case "sleeping":
        return {
          scale: [1, 1.04, 1],
          transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
        };
      case "eating":
        return {
          x: [0, -6, 6, -6, 6, 0],
          rotate: [0, 5, -5, 5, -5, 0],
          transition: { duration: 1.5, ease: "linear" }
        };
      case "trick":
        return {
          rotate: [0, 180, 360],
          scale: [1, 1.3, 1],
          y: [0, -50, 0],
          transition: { duration: 1.5, ease: "easeInOut" }
        };
      default:
        // Idle breathing float
        return {
          y: [0, -8, 0],
          transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
        };
    }
  };

  const equippedEmoji = animals.find(a => a.name === equippedCompanion)?.avatar || "🐼";

  const filteredAnimals = useMemo(() => {
    if (rarityFilter === "All") return animals;
    return animals.filter((a) => a.rarity === rarityFilter);
  }, [animals, rarityFilter]);

  return (
    <MainLayout>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 font-bold text-sm text-center shadow-sm"
        >
          {error}
        </div>
      )}
      <div className="max-w-7xl mx-auto py-2 sm:py-4 transition-all duration-300">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              🐾 Companions Marketplace
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-base">
              Unlock companions, customize your colors, and dynamically morph your workspace themes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/25 px-3.5 sm:px-5 py-2 sm:py-3 rounded-2xl">
            <Coins className="text-amber-500 dark:text-amber-400 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-extrabold text-amber-700 dark:text-amber-300 text-sm sm:text-lg">
              {coins} 🪙
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
            <div className="text-4xl animate-bounce">🐾</div>
            <p className="text-gray-500 dark:text-slate-400 ml-3 text-base sm:text-lg font-semibold">
              Opening companion marketplace...
            </p>
          </div>
        ) : (
          /* 2-Column Split Grid (8/12 Left, 4/12 Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

            {/* Left Column - Marketplace List (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">
                  Available Companions
                </h3>
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
                  {RARITY_FILTERS.map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer whitespace-nowrap ${
                        rarityFilter === rarity
                          ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "bg-white/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {rarity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAnimals.map((animal) => {
                  const isOwned = ownedCompanions.includes(animal.name);
                  const isActive = equippedCompanion === animal.name;

                  return (
                    <div
                      key={animal.name}
                      className={`glass-premium rounded-[24px] p-5 shadow-sm transition-all duration-300 flex flex-col h-full ${
                        isActive
                          ? "border-indigo-500 ring-2 ring-indigo-500/25 dark:ring-indigo-400/20"
                          : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex-grow">
                        {/* Animal Card Header */}
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-5xl select-none">{animal.avatar}</span>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${TIER_BADGES[animal.tier]}`}>
                              {animal.tier}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${RARITY_BADGES[animal.rarity]}`}>
                              {animal.rarity}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-50">
                          {animal.name}
                        </h4>

                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed h-12 overflow-hidden font-medium">
                          {animal.description}
                        </p>

                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-500">
                            Base Level 1
                          </span>
                          {!isOwned && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                              {animal.price} 🪙
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Purchasing / Activation buttons */}
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        {isActive ? (
                          <button
                            disabled
                            className="w-full bg-slate-50/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold py-2 rounded-xl text-xs cursor-default flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={12} /> Equipped ✅
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => handleEquip(animal.name)}
                            disabled={Boolean(pendingAnimal)}
                            aria-busy={pendingAnimal === animal.name}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          >
                            {pendingAnimal === animal.name ? "Equipping..." : "Equip & Apply Theme"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(animal)}
                            disabled={Boolean(pendingAnimal) || coins < animal.price}
                            aria-busy={pendingAnimal === animal.name}
                            title={coins < animal.price ? "Not enough coins yet" : undefined}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          >
                            {pendingAnimal === animal.name
                              ? "Unlocking..."
                              : `Unlock (${animal.price} 🪙)`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Equipped Preview (4/12) */}
            <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start space-y-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                Active Companion
              </h3>

              <div className="glass-premium rounded-[32px] p-6 shadow-sm text-center relative overflow-hidden flex flex-col justify-between">

                <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/10 to-transparent dark:from-indigo-950/5 pointer-events-none select-none" />

                <div>
                  <h4 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
                    Showcase: {equippedCompanion}
                  </h4>

                  {/* Stat Progress Bars */}
                  <div className="space-y-2 mt-4 text-left">
                    {/* Happiness Meter */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Heart size={10} className="text-red-500" /> Happiness</span>
                        <span>{happiness}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${happiness}%` }} />
                      </div>
                    </div>

                    {/* Energy Meter */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> Energy</span>
                        <span>{energy}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${energy}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Animated Avatar Box */}
                  <div className="my-8 relative flex justify-center items-center h-40">
                    <AnimatePresence>
                      {companionMood === "sleeping" && (
                        <>
                          <motion.span
                            initial={{ y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ y: -50, x: -15, opacity: [0, 1, 0], scale: 1.1 }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute text-lg font-extrabold text-indigo-500 select-none"
                          >
                            Z
                          </motion.span>
                          <motion.span
                            initial={{ y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ y: -70, x: 15, opacity: [0, 1, 0], scale: 1.3 }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2.2, delay: 0.6 }}
                            className="absolute text-xl font-extrabold text-purple-500 select-none"
                          >
                            Z
                          </motion.span>
                        </>
                      )}
                    </AnimatePresence>

                    {/* Custom Vector props overlays */}
                    {companionMood === "playing" && (
                      <motion.div
                        animate={{ x: [-70, 70, -70], rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute text-3xl bottom-2 z-0"
                      >
                        {equippedCompanion === "Cat" ? "🧶" : equippedCompanion === "Dog" ? "🎾" : equippedCompanion === "Rabbit" ? "🥕" : "⚽"}
                      </motion.div>
                    )}

                    {companionMood === "eating" && (
                      <motion.span
                        animate={{ scale: [0, 1.2, 0], y: [-10, -35] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute text-2xl font-bold z-20 pointer-events-none select-none"
                      >
                        {equippedCompanion === "Cat" ? "🐟" : equippedCompanion === "Dog" ? "🦴" : equippedCompanion === "Bear" ? "🍯" : equippedCompanion === "Rabbit" ? "🥕" : "🍎"}
                      </motion.span>
                    )}

                    {companionMood === "trick" && (
                      <motion.span
                        animate={{ scale: [0.6, 1.5, 0.6], rotate: 360, opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5 }}
                        className="absolute text-4xl text-amber-400 z-0 pointer-events-none"
                      >
                        ✨
                      </motion.span>
                    )}

                    {/* Core Animal Avatar Emoji */}
                    <motion.div
                      animate={getAvatarAnimation()}
                      className="text-8xl select-none cursor-pointer z-10"
                      onClick={triggerPet}
                    >
                      {equippedEmoji}
                    </motion.div>
                  </div>

                  {/* Dynamic Status Text */}
                  <div className="bg-slate-50/50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 min-h-[64px] flex items-center justify-center">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                      {statusText}
                    </p>
                  </div>
                </div>

                {/* Interaction Action Triggers */}
                <div className="grid grid-cols-2 gap-2 mt-6 border-t border-gray-100 dark:border-slate-800/80 pt-5">
                  <button
                    onClick={triggerPlay}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <Play size={12} className="text-indigo-600" />
                    Play Ball
                  </button>

                  <button
                    onClick={triggerFeed}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    Feed Snack
                  </button>

                  <button
                    onClick={triggerNap}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <BedDouble size={12} className="text-blue-500" />
                    Cozy Nap
                  </button>

                  <button
                    onClick={triggerTrick}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <Award size={12} className="text-purple-500" />
                    Special Trick
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default Companion;
