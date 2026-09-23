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
    </div>
  );
}

export default PandaAvatar;