import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { verifyOtpCode, resendVerificationOtp } from "../../services/authService";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email] = useState(
    location.state?.email || sessionStorage.getItem("pending_verify_email") || ""
  );
  const fullName = location.state?.fullName || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Store in sessionStorage so page reload preserves the email
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

  // Handle digit input across the 6 boxes
  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    const updated = [...otp];
    // If user typed/pasted a single digit
    updated[index] = cleanValue[cleanValue.length - 1];
    setOtp(updated);
    setError("");

    // Auto focus next input
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const updated = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      updated[i] = pastedData[i];
    }
    setOtp(updated);
    setError("");

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setError("Email address is missing. Please return to the registration page.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await verifyOtpCode(email, otpString);

      setSuccess("🎉 Email verified successfully! Redirecting to login...");
      sessionStorage.removeItem("pending_verify_email");

      // Redirect to login after brief celebratory pause
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            successMessage: "🎉 Your email has been verified! Please login to continue.",
            prefillEmail: email,
          },
        });
      }, 1500);
    } catch (err) {
      setError(err.message || "Invalid verification code.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending || !email) return;

    try {
      setResending(true);
      setError("");
      setSuccess("");
      await resendVerificationOtp(email, fullName);
      setSuccess("A fresh verification code has been sent to your email.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Unable to send verification email. Please try again.");
    } finally {
      setResending(false);
    }
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
            We sent a 6-digit verification code to
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6-Digit Code Inputs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-3">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={loading || Boolean(success)}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6 || Boolean(success)}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        {/* Resend OTP & Links */}
        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Didn't receive the code?{" "}
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
                {resending ? "Sending..." : "Resend Code"}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <Link
              to="/register"
              className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <ArrowLeft size={13} />
              Back to Create Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default VerifyEmail;
