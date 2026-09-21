import { Component } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

// React only surfaces render-time errors to class components, so this stays a
// class. Without it, a single thrown error unmounts the whole tree and the user
// is left staring at a blank white page with no way forward.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Kept as console output deliberately: there is no error-reporting service
    // wired up yet, and swallowing this silently would make production bugs
    // invisible. Point this at Sentry (or similar) when one exists.
    console.error("Unhandled UI error:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Navigating away should clear the error, otherwise the fallback sticks
    // around for routes that render perfectly well.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6">
        <div
          role="alert"
          className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 w-full max-w-lg p-8 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={26} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Something went wrong
          </h1>

          <p className="text-gray-500 dark:text-slate-400 mt-3">
            This page hit an unexpected error. Your data is safe — reloading
            usually clears it.
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-5 text-left text-xs bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 overflow-x-auto text-red-600 dark:text-red-400">
              {error.message}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-5 py-3 rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={16} /> Reload page
            </button>

            <Link
              to="/dashboard"
              onClick={() => this.setState({ error: null })}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Home size={16} /> Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
