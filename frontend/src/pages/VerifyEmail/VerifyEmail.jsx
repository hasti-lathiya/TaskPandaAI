import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email] = useState(
    () =>
      location.state?.email ||
      sessionStorage.getItem("pending_verify_email") ||
      auth.currentUser?.email ||
      ""
  );

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Preserve email in sessionStorage so page reload preserves the email
  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pending_verify_email", email);
    }
  }, [email]);

  // Countdown timer for Resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Check if user has clicked the verification link
  const handleCheckStatus = async () => {
    if (checking) return;
    try {
      setChecking(true);
      setError("");
      setSuccess("");

      const user = auth.currentUser;
      if (!user) {
        navigate("/login", {
          state: { prefillEmail: email },
        });
        return;
      }

      await user.reload();

      if (user.emailVerified) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { isVerified: true });
        } catch (dbErr) {
          console.warn("Firestore status update failed:", dbErr);
        }

        setSuccess("🎉 Email verified successfully! Redirecting to dashboard...");
        sessionStorage.removeItem("pending_verify_email");

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      } else {
        setError(
          "Your email is not verified yet. Please check your inbox (and spam folder) and click the verification link."
        );
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
      setError("Unable to check verification status. Please try logging in.");
    } finally {
      setChecking(false);
    }
  };

  // Resend verification email via Firebase Auth native service
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    const user = auth.currentUser;
    if (!user) {
      setError("Your session expired. Please log in to request a new verification email.");
      return;
    }

    try {
      setResending(true);
      setError("");
      setSuccess("");

      const actionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      };

      console.log("[Firebase Auth] Resending verification email to:", user.email);
      try {
        await sendEmailVerification(user, actionCodeSettings);
      } catch (actionCodeErr) {
        console.warn("[Firebase Auth] Resend fallback without actionCodeSettings:", actionCodeErr);
        await sendEmailVerification(user);
      }
      console.log("[Firebase Auth] Verification email resent successfully");

      setSuccess("A fresh verification link has been sent to your email!");
      setCountdown(60);
    } catch (err) {
      console.error("Firebase resend verification email error:", err);
      console.error("Firebase error code:", err?.code);
      console.error("Firebase error message:", err?.message);

      let friendlyMsg = "Unable to send verification email. Please try again later.";
      if (err?.code === "auth/too-many-requests") {
        friendlyMsg = "Too many verification requests. Please wait a few moments before trying again.";
      } else if (err?.code === "auth/quota-exceeded") {
        friendlyMsg = "Email service quota exceeded. Please contact support or try again later.";
      } else if (err?.code === "auth/network-request-failed") {
        friendlyMsg = "Network error. Please check your internet connection.";
      }

      setError(friendlyMsg);
    } finally {
      setResending(false);
    }
  };

  const handleGoToLogin = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    navigate("/login", {
      state: { prefillEmail: email },
    });
  };

  const handleBackToRegister = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-3xl w-full max-w-md p-8 transition-colors duration-300">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <Mail size={32} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-slate-100">
            Verify Your Email
          </h2>

          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            We sent a verification link to
          </p>

          <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5 break-all">
            {email || "your email address"}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3.5 rounded-xl mb-6 text-sm font-medium animate-fade-in"
          >
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-xl mb-6 text-sm font-medium animate-fade-in"
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            <p className="mb-2">
              <strong>Instructions:</strong> Open your email inbox, find the message from TaskPanda AI, and click the <strong>Verify</strong> link.
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              💡 <em>Didn&apos;t see it? Check your Spam or Junk folder. It may take a minute to arrive.</em>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {checking ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Checking status...
              </>
            ) : (
              <>
                I&apos;ve Verified My Email
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer font-medium text-sm"
          >
            Go to Login
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Didn&apos;t receive the email?{" "}
            {countdown > 0 ? (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending..." : "Resend Link"}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleBackToRegister}
              className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <ArrowLeft size={13} />
              Back to Create Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default VerifyEmail;
