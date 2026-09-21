import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useEffect, useState } from "react";

// Mirror of ProtectedRoute for the auth screens: a user who is already signed
// in has no reason to see the login or register form, so send them onward.
function PublicRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <h2 className="text-center mt-10">Loading...</h2>;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default PublicRoute;
