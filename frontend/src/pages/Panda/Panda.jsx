import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import MainLayout from "../../layouts/MainLayout";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

function Panda() {
  const [userData, setUserData] = useState({
    xp: 0,
    coins: 0,
    level: 1,
    streak: 0,
  });
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItem, setEquippedItem] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setUserData(data);
          setOwnedItems(data.ownedItems || []);
          setEquippedItem(data.equippedItem || "");
        }
      } catch (error) {
        console.log(error);
      }
    });

    return () => unsubscribe();
  }, []);

  const progress = ((userData.xp || 0) % 100);

  const getPandaMood = () => {
    if ((userData.streak || 0) >= 15) {
      return {
        emoji: "🤩🐼",
        mood: "Legend Panda",
        message: "You're unstoppable! Keep going!"
      };
    }

    if ((userData.streak || 0) >= 7) {
      return {
        emoji: "😄🐼",
        mood: "Happy Panda",
        message: "Amazing consistency!"
      };
    }

    if ((userData.streak || 0) >= 3) {
      return {
        emoji: "🙂🐼",
        mood: "Motivated Panda",
        message: "You're building momentum!"
      };
    }

    return {
      emoji: "😴🐼",
      mood: "Sleepy Panda",
      message: "Complete tasks to wake me up!"
    };
  };

  const panda = getPandaMood();
  const getEquippedEmoji = () => {
  switch (equippedItem) {
    case "Panda Hat":
      return "🎩";

    case "Panda Glasses":
      return "🕶️";

    case "Panda Backpack":
      return "🎒";

    case "Panda Crown":
      return "👑";

    default:
      return "";
  }
};

  const buyItem = async (item) => {
  if (ownedItems.includes(item.name)) {
    alert("You already own this item!");
    return;
  }

  if (userData.coins < item.price) {
    alert("Not enough coins!");
    return;
  }

  try {
    const newCoins = userData.coins - item.price;
    const newOwnedItems = [...ownedItems, item.name];

    const userRef = doc(
      db,
      "users",
      auth.currentUser.uid
    );

    await updateDoc(userRef, {
      coins: newCoins,
      ownedItems: newOwnedItems,
    });

    setUserData({
      ...userData,
      coins: newCoins,
    });

    setOwnedItems(newOwnedItems);

    alert(`Purchased ${item.name}!`);
  } catch (error) {
    console.log(error);
  }
};
  
  const equipItem = async (item) => {
  try {
    const userRef = doc(
      db,
      "users",
      auth.currentUser.uid
    );

    await updateDoc(userRef, {
      equippedItem: item.name,
    });

    setEquippedItem(item.name);

    alert(`${item.name} equipped!`);
  } catch (error) {
    console.log(error);
  }
};


  const shopItems = [
  {
    name: "Panda Hat",
    emoji: "🎩",
    price: 50,
  },
  {
    name: "Panda Glasses",
    emoji: "🕶️",
    price: 100,
  },
  {
    name: "Panda Backpack",
    emoji: "🎒",
    price: 150,
  },
  {
    name: "Panda Crown",
    emoji: "👑",
    price: 200,
  },
];

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

      {/* Panda Hero Card */}

      <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-3xl p-10 text-white shadow-xl mb-8">

        <div className="text-center">

          <div className="text-9xl mb-4">
          {getEquippedEmoji()} {panda.emoji}
          </div>

          <h2 className="text-4xl font-bold">
            {panda.mood}
          </h2>

          <p className="mt-3 text-lg">
            {panda.message}
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
            {userData.level || 1}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            ⭐ XP
          </p>

          <h2 className="text-5xl font-bold text-yellow-500 dark:text-amber-400 mt-3">
            {userData.xp || 0}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            🪙 Coins
          </p>

          <h2 className="text-5xl font-bold text-orange-500 dark:text-orange-400 mt-3">
            {userData.coins || 0}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-6 text-center transition-colors duration-300">
          <p className="text-gray-500 dark:text-slate-400">
            🔥 Streak
          </p>

          <h2 className="text-5xl font-bold text-red-500 dark:text-red-400 mt-3">
            {userData.streak || 0}
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

        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-6 overflow-hidden">

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

          <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-5 border border-transparent dark:border-slate-700/50">
            <div className="text-5xl">🐼</div>
            <p className="font-bold mt-3 text-slate-800 dark:text-slate-100">Baby Panda</p>
            <p className="text-gray-500 dark:text-slate-400">Level 1-4</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-5 border border-transparent dark:border-slate-700/50">
            <div className="text-5xl">🎓🐼</div>
            <p className="font-bold mt-3 text-slate-800 dark:text-slate-100">Student Panda</p>
            <p className="text-gray-500 dark:text-slate-400">Level 5-9</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-5 border border-transparent dark:border-slate-700/50">
            <div className="text-5xl">🥷🐼</div>
            <p className="font-bold mt-3 text-slate-800 dark:text-slate-100">Ninja Panda</p>
            <p className="text-gray-500 dark:text-slate-400">Level 10-19</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-5 border border-transparent dark:border-slate-700/50">
            <div className="text-5xl">👑🐼</div>
            <p className="font-bold mt-3 text-slate-800 dark:text-slate-100">King Panda</p>
            <p className="text-gray-500 dark:text-slate-400">Level 20+</p>
          </div>

        </div>

      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg p-8 mt-8 transition-colors duration-300">

  <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
    🛒 Panda Shop
  </h2>

  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

    {shopItems.map((item) => (

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

        {ownedItems.includes(item.name) ? (
  <button
    onClick={() => equipItem(item)}
    className={`mt-4 px-4 py-2 rounded-xl text-white font-medium transition cursor-pointer ${
      equippedItem === item.name
        ? "bg-green-500 dark:bg-green-600"
        : "bg-orange-500 dark:bg-amber-600 hover:bg-orange-600 dark:hover:bg-amber-700"
    }`}
  >
    {equippedItem === item.name
      ? "Equipped ✅"
      : "Equip"}
    </button>
)   : (
    <button
    onClick={() => buyItem(item)}
    className="mt-4 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium"
    >
      Buy
    </button>
    )}
        
      </div>

    ))}

  </div>

</div>
    </MainLayout>
  );
}

export default Panda;