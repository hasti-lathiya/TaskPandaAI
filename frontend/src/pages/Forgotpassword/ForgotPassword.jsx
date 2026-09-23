import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { getAuthErrorMessage } from "../../utils/authErrors";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against a second submit while the first request is still in flight.
    if (loading) return;

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-3.5 sm:p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-8 transition-colors duration-300">
        
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 text-sm font-bold mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2">🔑</h1>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            Reset Password
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Enter your email address and we'll send you a link to reset your account password.
          </p>
        </div>

        {success ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-green-50 dark:bg-green-950/65 border border-green-200 dark:border-green-900/50 rounded-2xl p-5 text-center mb-6 animate-in fade-in duration-300"
          >
            <CheckCircle className="text-green-600 dark:text-green-400 mx-auto mb-3" size={32} />
            <h3 className="font-bold text-green-800 dark:text-green-300 text-sm">Reset Email Sent</h3>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1 max-w-xs mx-auto">
              Please check your inbox at <span className="font-semibold">{email}</span> for instructions.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-5 w-full bg-green-600 dark:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-green-700 transition cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-5 font-bold text-sm text-center animate-fade-in shadow-sm"
              >
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="forgot-email"
                className="block mb-2 font-medium text-slate-700 dark:text-slate-200 text-sm"
              >
                Email Address
              </label>

              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-150">
                <Mail className="text-gray-400 dark:text-slate-400" size={20} />
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(error)}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-bold text-sm shadow-md shadow-indigo-600/10 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Sending link..." : "Send Password Reset Link"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;