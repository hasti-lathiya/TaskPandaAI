import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

function FloatingCompanionWidget() {
  const { equippedCompanion } = useTheme();
  
  // Interactive pet state: idle, playing, eating, sleeping, walking
  const [mood, setMood] = useState("idle");
  const [showMenu, setShowMenu] = useState(false);
  const [petMessage, setPetMessage] = useState("");

  // Map companion names to emojis
  const petEmojis = {
    Cat: "🐱",
    Dog: "🐶",
    Bear: "🐻",
    Panda: "🐼",
    Dolphin: "🐬",
    Lion: "🦁",
    Tiger: "🐅",
    Rabbit: "🐰",
    Fox: "🦊",
  };

  const equippedEmoji = petEmojis[equippedCompanion] || "🐼";

  // Actions configurations
  const petActions = {
    Cat: { food: "🐟", toy: "🧶", sound: "Meow! 🐾", habit: "purrs cozy" },
    Dog: { food: "🦴", toy: "🎾", sound: "Woof! 🐕", habit: "wags tail" },
    Bear: { food: "🍯", toy: "🌲", sound: "Grrr! 🐻", habit: "scratches back" },
    Panda: { food: "🎋", toy: "⚽", sound: "Squeak! 🐼", habit: "rolls around" },
    Dolphin: { food: "🐟", toy: "🛟", sound: "Click! 🐬", habit: "leaps high" },
    Lion: { food: "🥩", toy: "👑", sound: "Roar! 🦁", habit: "prances majestically" },
    Tiger: { food: "🥩", toy: "🔥", sound: "Growl! 🐅", habit: "prowls alerts" },
    Rabbit: { food: "🥕", toy: "🎈", sound: "Squeak! 🐰", habit: "hops happily" },
    Fox: { food: "🍒", toy: "🍂", sound: "Yip! 🦊", habit: "curls tail cozy" },
  };

  const traits = petActions[equippedCompanion] || petActions.Panda;

  // Clear message after delay
  useEffect(() => {
    if (petMessage) {
      const timer = setTimeout(() => setPetMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [petMessage]);

  // Trigger states
  const handleAction = (newMood, message) => {
    setMood(newMood);
    setPetMessage(message);
    setShowMenu(false);
    
    // Automatically revert to idle/walking state after animation complete (except sleep)
    if (newMood !== "sleeping") {
      setTimeout(() => {
        setMood("idle");
      }, 4000);
    }
  };

  // Determine motion animations
  const getAvatarAnimation = () => {
    switch (mood) {
      case "walking":
        return {
          x: [-60, 60, -60],
          scaleX: [1, -1, 1], // Flip direction when walking back
          transition: { repeat: Infinity, duration: 6, ease: "linear" }
        };
      case "playing":
        return {
          y: [0, -35, 0, -25, 0],
          rotate: [0, 360, 720],
          transition: { duration: 2, ease: "easeInOut" }
        };
      case "eating":
        return {
          scale: [1, 1.25, 0.9, 1.15, 1],
          x: [0, -4, 4, -4, 4, 0],
          transition: { duration: 1.8 }
        };
      case "sleeping":
        return {
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        };
      case "happy":
        return {
          y: [0, -20, 0, -15, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
          transition: { duration: 1.2 }
        };
      default: // idle breathing
        return {
          y: [0, -4, 0],
          transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        };
    }
  };

  return (
    <div className="fixed bottom-3.5 sm:bottom-6 right-3.5 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3 select-none pointer-events-none">
      
      {/* Speech / Action Bubble */}
      <AnimatePresence>
        {petMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 border border-slate-700 dark:border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-xl text-[11px] sm:text-xs font-bold pointer-events-auto max-w-[180px] sm:max-w-[200px] text-center"
          >
            {petMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pet Platform Container */}
      <div className="flex flex-col items-center pointer-events-auto">
        
        {/* Interaction triggers tray */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="flex gap-1 sm:gap-1.5 bg-slate-900/90 dark:bg-slate-800/95 border border-slate-700/80 p-1 sm:p-1.5 rounded-2xl shadow-2xl mb-2 sm:mb-2.5"
            >
              <button
                onClick={() => handleAction("eating", `Yum! Eating ${traits.food} 😋`)}
                title="Feed Pet"
                className="hover:bg-slate-800 dark:hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                🍖
              </button>
              <button
                onClick={() => handleAction("playing", `Wohoo! Playing ${traits.toy} ⚾`)}
                title="Play Ball"
                className="hover:bg-slate-800 dark:hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                ⚽
              </button>
              <button
                onClick={() => handleAction("sleeping", "Shhh... taking a cozy nap 💤")}
                title="Put to sleep"
                className="hover:bg-slate-800 dark:hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                💤
              </button>
              <button
                onClick={() => handleAction("walking", `Prowling: ${traits.habit} 🐾`)}
                title="Walk Around"
                className="hover:bg-slate-800 dark:hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                🐾
              </button>
              {mood === "sleeping" && (
                <button
                  onClick={() => handleAction("happy", `${traits.sound} Good morning! ☀️`)}
                  title="Wake Up"
                  className="hover:bg-slate-800 dark:hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm transition cursor-pointer bg-indigo-500/20 text-indigo-300 font-bold"
                >
                  ☀️
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pet Stage Area */}
        <div 
          onClick={() => {
            setShowMenu(!showMenu);
            if (mood === "idle") {
              handleAction("happy", `${traits.sound} hello human! ❤️`);
            }
          }}
          className="relative flex justify-center items-center cursor-pointer w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-100/10 hover:bg-slate-100/20 dark:hover:bg-slate-800/30 border border-gray-100/20 dark:border-slate-800/40 backdrop-blur-md shadow-lg transition duration-300"
        >
          {/* sleeping bubbles */}
          <AnimatePresence>
            {mood === "sleeping" && (
              <>
                <motion.span
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: -30, x: -10, opacity: [0, 1, 0], scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="absolute text-[10px] font-extrabold text-slate-400 select-none pointer-events-none"
                >
                  z
                </motion.span>
                <motion.span
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: -45, x: 10, opacity: [0, 1, 0], scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
                  className="absolute text-xs font-extrabold text-indigo-400 select-none pointer-events-none"
                >
                  Z
                </motion.span>
              </>
            )}
          </AnimatePresence>

          {/* Falling Food Emojis during eating state */}
          <AnimatePresence>
            {mood === "eating" && (
              <motion.span
                initial={{ y: -30, scale: 0.2, opacity: 0 }}
                animate={{ y: -5, scale: [1, 1.2, 0.6], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: 2 }}
                className="absolute text-xl pointer-events-none select-none z-20"
              >
                {traits.food}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Toy Emojis during play state */}
          <AnimatePresence>
            {mood === "playing" && (
              <motion.span
                animate={{ x: [-35, 35, -35], rotate: 360, y: [-5, -20, -5] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="absolute text-lg pointer-events-none select-none z-0"
              >
                {traits.toy}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Sparkles on trick / happy */}
          {mood === "happy" && (
            <motion.span
              animate={{ scale: [0.6, 1.4, 0.6], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute text-2xl text-amber-400 z-0 pointer-events-none select-none"
            >
              ✨
            </motion.span>
          )}

          {/* The Pet Animal Emoji */}
          <motion.div
            animate={getAvatarAnimation()}
            className="text-4xl filter drop-shadow-md cursor-pointer select-none"
          >
            {equippedEmoji}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default FloatingCompanionWidget;
