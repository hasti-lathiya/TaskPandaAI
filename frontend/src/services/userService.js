import { db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

export const createUserProfile = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        fullName: user.displayName || "",
        email: user.email,

        xp: 0,
        level: 1,
        coins: 0,
        streak: 0,

        createdAt: new Date(),
      });

      console.log("✅ User profile created.");
    } else {
      console.log("✅ User profile already exists.");
    }
  } catch (error) {
    console.error(error);
  }
};