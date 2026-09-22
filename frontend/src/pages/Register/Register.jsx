import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuthErrorMessage } from "../../utils/authErrors";

const MIN_PASSWORD_LENGTH = 6;

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Only nag about a mismatch once they have actually typed in the second box.
  const passwordsMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against a second submit while the first request is still in flight.
    if (loading) return;

    if (!formData.email.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      setError("Please fill in your name, email, and password.");
      return;
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // One canonical form of the address for both Auth and Firestore, so a
    // lookup that joins the two can never miss on casing or stray whitespace.
    const normalisedEmail = formData.email.trim().toLowerCase();

    let createdUser;

    // Flag to prevent PublicRoute from prematurely redirecting to /dashboard
    sessionStorage.setItem("registering_in_progress", "true");

    // Stage 1: Account Creation in Firebase Authentication
    try {
      setError("");
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalisedEmail,
        formData.password
      );

      createdUser = userCredential.user;
    } catch (err) {
      sessionStorage.removeItem("registering_in_progress");
      setError(getAuthErrorMessage(err));
      setLoading(false);
      return;
    }

    // Stage 2: Firestore User Profile Creation
    try {
      await updateProfile(createdUser, {
        displayName: formData.fullName,
      });

      await setDoc(doc(db, "users", createdUser.uid), {
        fullName: formData.fullName,
        email: normalisedEmail,
        role: "Computer Science Student",
        major: "Software Engineering",
        bio: "Active productivity companion grower and student.",
        xp: 0,
        level: 1,
        coins: 0,
        streak: 0,
        equippedCompanion: "Panda",
        ownedCompanions: ["Panda"],
        lastCompletedDate: "",
        isVerified: false,
        createdAt: new Date().toISOString(),
      });
    } catch (firestoreErr) {
      console.error("Firestore profile creation error:", firestoreErr);
      try {
        await deleteUser(createdUser);
      } catch (rollbackErr) {
        console.error("User rollback failed after Firestore error:", rollbackErr);
      }
      sessionStorage.removeItem("registering_in_progress");
      setError("Failed to create profile. Please try again.");
      setLoading(false);
      return;
    }

    // Stage 3: Verification Email Dispatch via Firebase Authentication
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      };

      console.log("[Firebase Auth] Sending verification email to:", createdUser.email);
      try {
        await sendEmailVerification(createdUser, actionCodeSettings);
      } catch (actionCodeErr) {
        console.warn("[Firebase Auth] ActionCodeSettings failed, falling back to standard verification:", actionCodeErr);
        await sendEmailVerification(createdUser);
      }
      console.log("[Firebase Auth] Verification email sent successfully");

      sessionStorage.removeItem("registering_in_progress");

      // Navigate to verification guidance page
      navigate("/verify-email", {
        replace: true,
        state: { email: normalisedEmail, fullName: formData.fullName },
      });
    } catch (emailErr) {
      console.error("Firebase verification email error:", emailErr);
      console.error("Firebase error code:", emailErr?.code);
      console.error("Firebase error message:", emailErr?.message);

      // Clean rollback of created user so they can re-attempt registration
      try {
        await deleteUser(createdUser);
      } catch (rollbackErr) {
        console.error("User rollback failed after email error:", rollbackErr);
      }
      sessionStorage.removeItem("registering_in_progress");

      let friendlyMsg = "Unable to send verification email. Please try again later.";
      if (emailErr?.code === "auth/too-many-requests") {
        friendlyMsg = "Too many verification requests. Please wait a few moments before trying again.";
      } else if (emailErr?.code === "auth/quota-exceeded") {
        friendlyMsg = "Email service quota exceeded. Please contact support or try again later.";
      } else if (emailErr?.code === "auth/network-request-failed") {
        friendlyMsg = "Network error. Please check your internet connection and try again.";
      } else if (emailErr?.code === "auth/unauthorized-continue-uri") {
        friendlyMsg = "Email configuration error: The continue domain is not authorized in Firebase Console.";
      } else if (emailErr?.code === "auth/invalid-continue-uri") {
        friendlyMsg = "Email configuration error: Invalid continue URL.";
      }

      setError(friendlyMsg);
      setLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6 transition-colors duration-300">

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-3xl w-full max-w-md p-8 transition-colors duration-300">

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 font-bold text-sm text-center animate-fade-in shadow-sm"
          >
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2">🐼</h1>

          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            Create Account
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Join TaskPanda AI today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Full Name */}

          <div>
            <label
              htmlFor="register-fullname"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Full Name
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <User className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="register-fullname"
                type="text"
                name="fullName"
                autoComplete="name"
                required
                aria-invalid={Boolean(error)}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          {/* Email */}

          <div>
            <label
              htmlFor="register-email"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Mail className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          {/* Password */}

          <div>
            <label
              htmlFor="register-password"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                aria-invalid={Boolean(error)}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>
          </div>

          {/* Confirm Password */}

          <div>
            <label
              htmlFor="register-confirm"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Confirm Password
            </label>

            <div
              className={`flex items-center border rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 ${
                passwordsMismatch
                  ? "border-red-400 dark:border-red-500/70 focus-within:ring-red-500"
                  : "border-gray-200 dark:border-slate-700 focus-within:ring-indigo-500"
              }`}
            >

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="register-confirm"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                aria-invalid={passwordsMismatch || Boolean(error)}
                aria-describedby={passwordsMismatch ? "confirm-mismatch" : undefined}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {passwordsMismatch && (
              <p
                id="confirm-mismatch"
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
              >
                Passwords do not match.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">

          Already have an account?

          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-semibold ml-2"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;