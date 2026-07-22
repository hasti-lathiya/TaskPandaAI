function LevelUpModal({
  isOpen,
  level,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-3xl p-10 w-[420px] text-center shadow-2xl">

        <div className="text-7xl mb-4">
          🎉
        </div>

        <h2 className="text-4xl font-bold text-indigo-600">
          LEVEL UP!
        </h2>

        <p className="mt-5 text-xl">
          🐼 Your Panda reached
        </p>

        <p className="text-3xl font-bold mt-2">
          Level {level}
        </p>

        <p className="mt-5 text-gray-500">
          Keep completing tasks to grow your Panda!
        </p>

        <button
          onClick={onClose}
          className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition"
        >
          Awesome!
        </button>

      </div>

    </div>
  );
}

export default LevelUpModal;