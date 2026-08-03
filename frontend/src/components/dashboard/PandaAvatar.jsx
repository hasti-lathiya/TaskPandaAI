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

  if (level >= 5) {
    return <div className="text-8xl">👑{emoji}</div>;
  }

  if (level >= 4) {
    return <div className="text-8xl">💪{emoji}</div>;
  }

  if (level >= 3) {
    return <div className="text-8xl">{emoji}✨</div>;
  }

  if (level >= 2) {
    return <div className="text-8xl">{emoji}</div>;
  }

  return <div className="text-8xl">🐣</div>;
}

export default PandaAvatar;