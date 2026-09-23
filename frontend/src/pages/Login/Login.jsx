import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, RefreshCw } from "lucide-react";

import { signInWithEmailAndPassword, signOut, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { setFlashMessage } from "../../utils/flashMessage";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("verified") === "true") {
      return "🎉 Your email has been verified! Please login to continue.";
    }
    return location.state?.successMessage || "";
  });
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.prefillEmail || "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resending) return;
    try {
      setResending(true);
      setError("");
      setSuccess("");

      if (formData.password) {
        const cred = await signInWithEmailAndPassword(auth, unverifiedEmail, formData.password);
        const actionCodeSettings = {
          url: `${window.location.origin}/login?verified=true`,
          handleCodeInApp: false,
        };
        try {
          await sendEmailVerification(cred.user, actionCodeSettings);
        } catch {
          await sendEmailVerification(cred.user);
        }
        await signOut(auth);
        setSuccess("A fresh verification link has been sent to your email! Please check your inbox.");
      } else {
        navigate("/verify-email", {
          state: { email: unverifiedEmail },
        });
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against a second submit while the first request is still in flight.
    if (loading) return;

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please enter both your email and password.");
      setSuccess("");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setUnverifiedEmail("");
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Check email verification status
      let isVerified = user.emailVerified;
      if (!isVerified && userDocSnap.exists() && userDocSnap.data()?.isVerified === true) {
        isVerified = true;
      }

      if (!isVerified) {
        // Destroy session immediately for unverified users
        const userEmail = user.email || formData.email.trim().toLowerCase();
        await signOut(auth);
        setError("Your email has not been verified yet. Please check your inbox for the verification link before logging in.");
        setUnverifiedEmail(userEmail);
        setLoading(false);
        return;
      }

      // Sync Firestore if needed
      try {
        await updateDoc(userDocRef, { isVerified: true });
      } catch (dbErr) {
        console.warn("Firestore updateDoc error on login:", dbErr);
      }

      setFlashMessage("🎉 Login Successful!");

      navigate("/dashboard", {
        replace: true,
        state: { successMessage: "🎉 Login Successful!" },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err));
      // Only release the lock on failure; on success we are navigating away.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-3.5 sm:p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-8 transition-colors duration-300">

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl mb-6 font-bold text-sm text-center animate-fade-in shadow-sm"
          >
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 font-medium text-sm text-center animate-fade-in shadow-sm"
          >
            <div>{error}</div>
            {unverifiedEmail && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-2.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {resending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Sending verification link...
                  </>
                ) : (
                  "Resend Verification Link →"
                )}
              </button>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2">🐼</h1>

          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            Welcome Back
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Login to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          <div>
            <label
              htmlFor="login-email"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Mail className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          <div>

            <label
              htmlFor="login-password"
              className="block mb-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
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

          <div className="text-right">

            <Link
              to="/forgot-password"
              className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
            >
              Forgot Password?
            </Link>

          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">

          Don't have an account?

          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 font-semibold ml-2"
          >
            Register
          </Link>

        </p>

      </div>
    </div>
  );
}

export default Login;