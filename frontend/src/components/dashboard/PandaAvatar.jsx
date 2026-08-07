function PandaAvatar({ level, companion = "Panda" }) {
  const companionEmojis = {
    Panda: "🐼",
    Cat: "🐱",
    Dog: "🐶",
    Bear: "🐻",
    Dolphin: "🐬",
    Lion: "🦁",
    Tiger: "🐅",
    Rabbit: "🐰",
    Fox: "🦊"
  };

  const emoji = companionEmojis[companion] || "🐼";
  const emojiSizeClass = "text-7xl md:text-8xl";

  if (level === 1) {
    return <div className={`${emojiSizeClass} select-none`}>🐣</div>;
  }

  return (
    <div className="relative inline-block select-none leading-none">
      {/* Base Companion Emoji */}
      <span className={emojiSizeClass}>{emoji}</span>
      
      {/* Level Decorators */}
      {level >= 5 && (
        <span className="absolute -top-4 -right-3 text-3xl md:text-4xl animate-bounce">
          👑
        </span>
      )}
      {level === 4 && (
        <span className="absolute -bottom-2 -right-3 text-2xl md:text-3xl">
          💪
        </span>
      )}
      {level === 3 && (
        <span className="absolute -top-2 -right-3 text-2xl md:text-3xl animate-pulse">
          ✨
        </span>
      )}
    </div>
  );
}

export default PandaAvatar;