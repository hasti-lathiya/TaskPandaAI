function PandaAvatar({ level }) {
  if (level >= 5) {
    return <div className="text-8xl">👑🐼</div>;
  }

  if (level >= 4) {
    return <div className="text-8xl">💪🐼</div>;
  }

  if (level >= 3) {
    return <div className="text-8xl">🐼✨</div>;
  }

  if (level >= 2) {
    return <div className="text-8xl">🐼</div>;
  }

  return <div className="text-8xl">🐣</div>;
}

export default PandaAvatar;