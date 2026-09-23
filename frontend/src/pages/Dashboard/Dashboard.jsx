import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { peekFlashMessage, clearFlashMessage } from "../../utils/flashMessage";
import ProductivityChart from "../../components/dashboard/ProductivityChart";
import StatsCard from "../../components/dashboard/StatsCard";
import MainLayout from "../../layouts/MainLayout";
import useTaskStats from "../../hooks/useTaskStats";
import useUserStats from "../../hooks/useUserStats";
import useAchievements from "../../hooks/useAchievements";
import WelcomeCard from "../../components/dashboard/WelcomeCard";
import StreakRepairCard from "../../components/dashboard/StreakRepairCard";
import RecentTasks from "../../components/dashboard/RecentTasks";
import LevelUpModal from "../../components/dashboard/LevelUpModal";
import AchievementsPanel from "../../components/dashboard/AchievementsPanel";
import AchievementUnlockModal from "../../components/dashboard/AchievementUnlockModal";

function Dashboard() {
  const stats = useTaskStats();
  const userStats = useUserStats();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const location = useLocation();

  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState(
    () => location.state?.successMessage || peekFlashMessage()
  );
  const prevLevelRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Achievement unlock queue: shows one modal at a time for any badge
  // that transitions locked -> unlocked while this page is mounted.
  const [unlockQueue, setUnlockQueue] = useState([]);
  const seenUnlockedIdsRef = useRef(null);

  useEffect(() => {
    // Wait for the real Firestore snapshot before tracking "new" unlocks —
    // otherwise the placeholder all-locked default state (used before the
    // first snapshot arrives) gets treated as the baseline, and every
    // already-unlocked badge would incorrectly re-show the unlock modal
    // on every Dashboard mount.
    if (achievementsLoading) return;

    const currentlyUnlockedIds = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));

    if (seenUnlockedIdsRef.current === null) {
      // First real snapshot for this mount — establish the baseline
      // without treating already-unlocked badges as "new".
      seenUnlockedIdsRef.current = currentlyUnlockedIds;
      return;
    }

    const newlyUnlocked = achievements.filter(
      (a) => a.unlocked && !seenUnlockedIdsRef.current.has(a.id)
    );

    if (newlyUnlocked.length > 0) {
      setUnlockQueue((prev) => [...prev, ...newlyUnlocked]);
    }

    seenUnlockedIdsRef.current = currentlyUnlockedIds;
  }, [achievements, achievementsLoading]);

  // Clear success banner state from history to prevent showing on refresh
  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Consume the stored flash exactly once, so a refresh doesn't replay it.
  useEffect(() => {
    clearFlashMessage();
  }, []);

  // The banner is an acknowledgement, not a permanent fixture — retire it on
  // its own so it cannot sit there for the rest of the session.
  useEffect(() => {
    if (!successBanner) return;

    const timer = setTimeout(() => setSuccessBanner(""), 6000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  // Monitor Level Up triggers (only when level changes to a higher number after initial mount)
  useEffect(() => {
    if (userStats && !userStats.loading && userStats.level !== undefined) {
      if (isFirstLoadRef.current) {
        prevLevelRef.current = userStats.level;
        isFirstLoadRef.current = false;
      } else {
        if (prevLevelRef.current !== null && userStats.level > prevLevelRef.current) {
          setLevelUpOpen(true);
        }
        prevLevelRef.current = userStats.level;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStats?.level, userStats?.loading]);

  // Dynamic statistics progress percentages
  const completedPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const pendingPercentage = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-2 space-y-6 sm:space-y-8 animate-fade-in">
        {successBanner && (
          <div
            role="status"
            aria-live="polite"
            className="relative bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 p-3.5 sm:p-4 pr-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-center shadow-sm animate-fade-in"
          >
            {successBanner}

            <button
              onClick={() => setSuccessBanner("")}
              aria-label="Dismiss message"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Welcome Hero Panel (Consolidated Welcome and Panda Companion Growth stats) */}
        <WelcomeCard userStats={userStats} />

        <StreakRepairCard userStats={userStats} />

        {/* Dynamic Statistics Cards Grid (2x2 on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            title="📋 Total Tasks"
            value={stats.total}
            color="text-indigo-600 dark:text-indigo-400"
            progress={100}
          />

          <StatsCard
            title="✅ Completed"
            value={stats.completed}
            color="text-green-600 dark:text-green-400"
            progress={completedPercentage}
          />

          <StatsCard
            title="⏳ Pending"
            value={stats.pending}
            color="text-orange-500 dark:text-orange-400"
            progress={pendingPercentage}
          />

          <StatsCard
            title="📈 Completion"
            value={`${stats.completionRate}%`}
            color="text-purple-600 dark:text-purple-400"
            progress={stats.completionRate}
          />
        </div>

        {/* Interactive Analytics and Tasks */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <ProductivityChart />
          <RecentTasks />
        </div>

        {/* Achievements */}
        <AchievementsPanel />
      </div>

      {/* Gamification Level Up Feedback */}
      <LevelUpModal
        isOpen={levelUpOpen}
        level={userStats.level}
        onClose={() => setLevelUpOpen(false)}
      />

      {/* Achievement Unlock Feedback (one at a time, queued) */}
      <AchievementUnlockModal
        achievement={unlockQueue[0] || null}
        onClose={() => setUnlockQueue((prev) => prev.slice(1))}
      />
    </MainLayout>
  );
}

export default Dashboard;