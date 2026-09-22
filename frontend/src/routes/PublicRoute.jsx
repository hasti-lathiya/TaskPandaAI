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

  // If user is actively registering, do not redirect to dashboard
  if (sessionStorage.getItem("registering_in_progress") === "true") {
    return children;
  }

  // Only redirect if the user is authenticated AND email is verified
  return user && user.emailVerified ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}

export default PublicRoute;
