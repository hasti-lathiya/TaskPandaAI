import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, BedDouble, Play, CheckCircle, Heart, Zap, Award } from "lucide-react";
import { db, auth } from "../../firebase/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import MainLayout from "../../layouts/MainLayout";

function Companion() {
  const { equippedCompanion, changeCompanion } = useTheme();
  const { addNotification } = useNotifications();
  
  const [userData, setUserData] = useState({
    coins: 0,
    level: 1,
    xp: 0,
  });

  const [ownedCompanions, setOwnedCompanions] = useState(["Panda"]);
  const [loading, setLoading] = useState(true);
  
  // Companion Interactive Stats
  const [companionMood, setCompanionMood] = useState("idle"); // idle, playing, happy, sleeping, eating, trick
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(70);

  const animals = useMemo(() => [
    {
      name: "Panda",
      tier: "Cute",
      description: "A lazy, bamboo-loving giant panda that enjoys cozy naps.",
      avatar: "🐼",
      price: 0,
      behaviors: {
        idle: "is sitting comfortably, chewing on a sweet bamboo branch.",
        playing: "is rolling around doing clumsy somersaults!",
        happy: "is doing a happy dance and giving you a warm panda hug!",
        sleeping: "is snoozing peacefully on a soft bamboo mattress.",
        eating: "is munching hungrily on fresh green bamboo leaves.",
        trick: "does a perfect backward roll and waves its paws at you! 🎋",
      }
    },
    {
      name: "Cat",
      tier: "Cute",
      description: "A sassy, playful calico cat that loves chasing yarn balls.",
      avatar: "🐱",
      price: 300,
      behaviors: {
        idle: "is sitting gracefully and licking its paw.",
        playing: "is batting a bright blue yarn ball back and forth!",
        happy: "is purring loudly and rubbing its head against your hand.",
        sleeping: "is curled up in a tiny ball, taking a warm sun-drenched nap.",
        eating: "is happily nibbling on a fresh tuna fish snack.",
        trick: "leaps high into the air, does a graceful twist, and lands perfectly! 🐾",
      }
    },
    {
      name: "Dog",
      tier: "Cute",
      description: "A loyal, energetic golden retriever always ready to play fetch.",
      avatar: "🐶",
      price: 300,
      behaviors: {
        idle: "is sitting attentively and wagging its tail with excitement.",
        playing: "is chasing after a tennis ball, tail wagging at lightspeed!",
        happy: "is barking joyfully and running in happy circles!",
        sleeping: "is lying down, snoring softly while dreaming of bones.",
        eating: "is chewing enthusiastically on a big juicy bone.",
        trick: "rolls over onto its back, wags its paws, and plays dead! 🦴",
      }
    },
    {
      name: "Bear",
      tier: "Cute",
      description: "A gentle brown bear who is always searching for sweet honey.",
      avatar: "🐻",
      price: 400,
      behaviors: {
        idle: "is standing tall, watching over you with a warm smile.",
        playing: "is scratch-massaging its back against a wooden log!",
        happy: "is roaring happily, covered in sweet golden honey!",
        sleeping: "is hibernating cozily under a pile of soft autumn leaves.",
        eating: "is scooping mouthfulls of honey out of a large clay jar.",
        trick: "stands on its hind legs and waves a giant, friendly bear greeting! 🍯",
      }
    },
    {
      name: "Dolphin",
      tier: "Aquatic",
      description: "A brilliant aquatic genius who leaps through water loops.",
      avatar: "🐬",
      price: 500,
      behaviors: {
        idle: "is floating gently on water currents, chirping happily.",
        playing: "is bouncing a colorful beachball on its snout!",
        happy: "leaps out of the water, creating a sparkling splash!",
        sleeping: "is floating half-asleep, drifting with the ocean tide.",
        eating: "is snapping up small, delicious silver fish.",
        trick: "performs a double backflip through a rings-of-water hoop! 🌊",
      }
    },
    {
      name: "Lion",
      tier: "Apex",
      description: "The king of companions, displaying noble stances and playful roars.",
      avatar: "🦁",
      price: 600,
      behaviors: {
        idle: "is pacing back and forth majestically, guarding your workspace.",
        playing: "is batting around a giant round toy boulder!",
        happy: "is rubbing against you like a giant friendly housecat.",
        sleeping: "is napping lazily under the golden sun's rays.",
        eating: "is enjoying a large royal steak platter.",
        trick: "lets out a mighty, rumbling roar that shakes the dashboard! 👑",
      }
    },
    {
      name: "Tiger",
      tier: "Apex",
      description: "A bengal tiger who prowls gracefully with sunset amber stripes.",
      avatar: "🐅",
      price: 650,
      behaviors: {
        idle: "is prowling gracefully, ears twitching at every sound.",
        playing: "is pouncing on a moving laser pointer light!",
        happy: "lets out a soft chuffing noise and stretches its paws.",
        sleeping: "is sprawled out flat, yawning and stretching.",
        eating: "is chewing hungrily on prime meat snacks.",
        trick: "does a stealthy leap forward and shows a playful tiger strike! ⚡",
      }
    },
    {
      name: "Rabbit",
      tier: "Cute",
      description: "An ultra-fluffy rabbit who hops around and munches carrots.",
      avatar: "🐰",
      price: 350,
      behaviors: {
        idle: "is wiggling its nose and twitching its long ears.",
        playing: "is hopping happily in zigzag patterns!",
        happy: "is doing a high-speed bunny hop and binkying in mid-air!",
        sleeping: "is nestled down, eyes closed, breathing softly.",
        eating: "is munching quickly on a sweet crunchy carrot.",
        trick: "does a swift mid-air spin and hops right up to groom itself! 🥕",
      }
    },
    {
      name: "Fox",
      tier: "Cute",
      description: "A mystical forest fox who curls up in its tail and trots around.",
      avatar: "🦊",
      price: 350,
      behaviors: {
        idle: "is sitting quietly, wrapping its fluffy orange tail around its paws.",
        playing: "is diving headfirst into a pile of autumn leaves!",
        happy: "is yip-barking happily, eyes narrowed in joy.",
        sleeping: "is curled up asleep, hidden snugly under its fluffy tail.",
        eating: "is happily nibbling on a bunch of sweet forest berries.",
        trick: "does a high leap, catches a floating autumn leaf, and lands safely! 🍂",
      }
    }
  ], []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        setLoading(true);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          
          // Load owned companions
          const owned = data.ownedCompanions || ["Panda"];
          setOwnedCompanions(owned);
          
          // Sync equipped companion
          if (data.equippedCompanion) {
            changeCompanion(data.equippedCompanion);
          }
        }
      } catch (error) {
        console.error("Error loading companion data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [changeCompanion]);

  // Compute status text dynamically
  const currentAnimal = useMemo(() => {
    return animals.find(a => a.name === equippedCompanion) || animals[0];
  }, [animals, equippedCompanion]);

  const statusText = `${currentAnimal.name} ${currentAnimal.behaviors[companionMood]}`;

  // Handle purchasing workflow
  const handlePurchase = async (animal) => {
    if (ownedCompanions.includes(animal.name)) return;
    
    if (userData.coins < animal.price) {
      alert("Not enough coins! Complete more tasks to earn coins. 🪙");
      return;
    }

    try {
      const current = auth.currentUser;
      if (!current) return;

      const newCoins = userData.coins - animal.price;
      const newOwned = [...ownedCompanions, animal.name];

      const userRef = doc(db, "users", current.uid);
      await updateDoc(userRef, {
        coins: newCoins,
        ownedCompanions: newOwned,
      });

      setUserData(prev => ({ ...prev, coins: newCoins }));
      setOwnedCompanions(newOwned);
      alert(`🎉 Congratulations! You unlocked the ${animal.name} companion.`);
    } catch (error) {
      console.error("Error buying companion:", error);
      alert("Failed to complete purchase.");
    }
  };

  // Handle activation/equip workflow
  const handleEquip = async (animalName) => {
    if (!ownedCompanions.includes(animalName)) return;

    try {
      const current = auth.currentUser;
      if (!current) return;

      const userRef = doc(db, "users", current.uid);
      await updateDoc(userRef, {
        equippedCompanion: animalName,
      });

      changeCompanion(animalName);
      await addNotification("Companion Equipped! 🐾", `Equipped ${animalName} theme!`, "system");
      setCompanionMood("idle");
      setHappiness(85);
      setEnergy(75);
    } catch (error) {
      console.error("Error equipping companion:", error);
      alert("Failed to equip companion.");
    }
  };

  // Interaction triggers (play, feed, sleep, trick)
  const triggerPlay = () => {
    if (energy < 15) {
      alert(`${equippedCompanion} is too tired to play! Put them to sleep first. 💤`);
      return;
    }
    setCompanionMood("playing");
    setHappiness(prev => Math.min(prev + 15, 100));
    setEnergy(prev => Math.max(prev - 10, 0));
    setTimeout(() => setCompanionMood("idle"), 2500);
  };

  const triggerFeed = () => {
    setCompanionMood("eating");
    setEnergy(prev => Math.min(prev + 20, 100));
    setHappiness(prev => Math.min(prev + 5, 100));
    setTimeout(() => setCompanionMood("idle"), 2000);
  };

  const triggerNap = () => {
    setCompanionMood("sleeping");
    setEnergy(prev => Math.min(prev + 30, 100));
    setTimeout(() => setCompanionMood("idle"), 5000);
  };

  const triggerTrick = () => {
    if (energy < 25) {
      alert(`${equippedCompanion} doesn't have enough energy for a trick! ⚡`);
      return;
    }
    setCompanionMood("trick");
    setHappiness(prev => Math.min(prev + 20, 100));
    setEnergy(prev => Math.max(prev - 20, 0));
    setTimeout(() => setCompanionMood("idle"), 3000);
  };

  const triggerInteraction = (mood, duration = 3000) => {
    setCompanionMood(mood);
    setHappiness(prev => Math.min(prev + 10, 100));
    setTimeout(() => {
      setCompanionMood("idle");
    }, duration);
  };

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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              🐾 Animal Companions Marketplace
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              Unlock companions, customize your colors, and dynamically morph your workspace themes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/25 px-5 py-3 rounded-2xl">
            <Coins className="text-amber-500 dark:text-amber-400" size={20} />
            <span className="font-extrabold text-amber-700 dark:text-amber-300 text-lg">
              {userData.coins} 🪙
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-[32px] p-8 shadow-sm">
            <div className="text-4xl animate-bounce">🐾</div>
            <p className="text-gray-500 dark:text-slate-400 ml-3 text-lg font-semibold">
              Opening companion marketplace...
            </p>
          </div>
        ) : (
          /* 2-Column Split Grid (8/12 Left, 4/12 Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column - Marketplace List (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200 border-b border-gray-150 dark:border-slate-800/80 pb-2">
                Available Companions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {animals.map((animal) => {
                  const isOwned = ownedCompanions.includes(animal.name);
                  const isActive = equippedCompanion === animal.name;

                  // Define badge tags based on tier
                  const tierColors = {
                    Cute: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200",
                    Aquatic: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200",
                    Apex: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200",
                  };

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
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${tierColors[animal.tier]}`}>
                            {animal.tier}
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-slate-850 dark:text-slate-50">
                          {animal.name}
                        </h4>
                        
                        <p className="text-slate-505 dark:text-slate-400 text-xs mt-2 leading-relaxed h-12 overflow-hidden font-medium">
                          {animal.description}
                        </p>
                        
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-[9px] bg-slate-50 dark:bg-slate-850 border border-gray-150 dark:border-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-500">
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
                            className="w-full bg-slate-50/50 dark:bg-slate-850 text-slate-400 dark:text-slate-655 font-bold py-2 rounded-xl text-xs cursor-default flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={12} /> Equipped ✅
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => handleEquip(animal.name)}
                            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition hover:-translate-y-0.5 cursor-pointer"
                          >
                            Equip & Apply Theme
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(animal)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1"
                          >
                            Unlock ({animal.price} 🪙)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Equipped Preview (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200 border-b border-gray-150 dark:border-slate-800/80 pb-2">
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
                      onClick={() => triggerInteraction("happy")}
                    >
                      {equippedEmoji}
                    </motion.div>
                  </div>

                  {/* Dynamic Status Text */}
                  <div className="bg-slate-50/50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 min-h-[64px] flex items-center justify-center">
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                      {statusText}
                    </p>
                  </div>
                </div>

                {/* Interaction Action Triggers */}
                <div className="grid grid-cols-2 gap-2 mt-6 border-t border-gray-100 dark:border-slate-800/80 pt-5">
                  <button
                    onClick={triggerPlay}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <Play size={12} className="text-indigo-600" />
                    Play Ball
                  </button>

                  <button
                    onClick={triggerFeed}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    Feed Snack
                  </button>

                  <button
                    onClick={triggerNap}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
                  >
                    <BedDouble size={12} className="text-blue-500" />
                    Cozy Nap
                  </button>

                  <button
                    onClick={triggerTrick}
                    disabled={companionMood !== "idle"}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition disabled:opacity-40 cursor-pointer text-xs font-bold text-gray-600 dark:text-slate-300"
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
