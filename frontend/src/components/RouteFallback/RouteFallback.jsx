import { Loader2 } from "lucide-react";

// Shown while a lazily-loaded route chunk is fetched. Deliberately quiet — on a
// fast connection it flashes for a few frames, so it should not be a spectacle.
function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
    >
      <Loader2
        className="animate-spin text-indigo-600 dark:text-indigo-400"
        size={36}
      />
      <p className="text-gray-500 dark:text-slate-400 mt-4 font-semibold text-sm">
        Loading…
      </p>
    </div>
  );
}

export default RouteFallback;
