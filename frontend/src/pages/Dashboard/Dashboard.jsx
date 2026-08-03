import { useEffect, useState, useRef } from "react";
import ProductivityChart from "../../components/dashboard/ProductivityChart";
import StatsCard from "../../components/dashboard/StatsCard";
import MainLayout from "../../layouts/MainLayout";
import useTaskStats from "../../hooks/useTaskStats";
import useUserStats from "../../hooks/useUserStats";
import WelcomeCard from "../../components/dashboard/WelcomeCard";
import RecentTasks from "../../components/dashboard/RecentTasks";
import LevelUpModal from "../../components/dashboard/LevelUpModal";

function Dashboard() {
  const stats = useTaskStats();
  const userStats = useUserStats();
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const prevLevelRef = useRef(null);
  const isFirstLoadRef = useRef(true);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-8 animate-fade-in">
        {/* Welcome Hero Panel (Consolidated Welcome and Panda Companion Growth stats) */}
        <WelcomeCard userStats={userStats} />

        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="📋 Total Tasks"
            value={stats.total}
            color="text-indigo-650 dark:text-indigo-400"
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
            color="text-purple-650 dark:text-purple-400"
            progress={stats.completionRate}
          />
        </div>

        {/* Interactive Analytics and Tasks */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ProductivityChart />
          <RecentTasks />
        </div>
      </div>

      {/* Gamification Level Up Feedback */}
      <LevelUpModal
        isOpen={levelUpOpen}
        level={userStats.level}
        onClose={() => setLevelUpOpen(false)}
      />
    </MainLayout>
  );
}

export default Dashboard;