import { Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

      // Check if user is unverified in Firestore
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data().isVerified === false) {
          await signOut(auth);
          setUser(null);
          setIsVerified(false);
          return;
        }
      } catch {
        // Continue if offline / emulator
      }

      setUser(currentUser);
      setIsVerified(true);
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