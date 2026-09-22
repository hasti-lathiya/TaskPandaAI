import { Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      // If email is verified in Firebase Auth, ensure Firestore reflects it and allow entry
      if (currentUser.emailVerified) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await updateDoc(userDocRef, { isVerified: true });
        } catch {
          // Continue if Firestore write fails (offline, etc.)
        }
        setUser(currentUser);
        setIsVerified(true);
        return;
      }

      // If emailVerified is false in Auth, check Firestore as fallback (e.g. manual verification)
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data()?.isVerified === true) {
          setUser(currentUser);
          setIsVerified(true);
          return;
        }
      } catch {
        // Continue if offline / emulator
      }

      // User is genuinely unverified: sign out and redirect to login
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
      setUser(null);
      setIsVerified(false);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <h2 className="text-center mt-10">Loading...</h2>;
  }

  if (!user || !isVerified) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;