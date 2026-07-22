import PandaAvatar from "../../components/Dashboard/PandaAvatar";
import ProductivityChart from "../../components/dashboard/ProductivityChart";
import StatsCard from "../../components/dashboard/StatsCard";
import MainLayout from "../../layouts/MainLayout";
import useTaskStats from "../../hooks/useTaskStats";
import useUserStats from "../../hooks/useUserStats";
import WelcomeCard from "../../components/dashboard/WelcomeCard";
import RecentTasks from "../../components/dashboard/RecentTasks";

function Dashboard() {
  const stats = useTaskStats();
  const userStats = useUserStats();

  const progress = userStats.xp % 100;

  return (
    <MainLayout>

      {/* Welcome Section */}
      <WelcomeCard />

      {/* Panda Summary Card */}

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 mb-8 transition-colors duration-300">

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Left Side */}
          <div className="flex-1">

            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🐼</span>

              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  Panda Companion
                </h2>

                <p className="text-gray-500 dark:text-slate-400 mt-1">
                  Stay consistent and help your panda grow.
                </p>
              </div>
            </div>

            <div className="mt-6">

              <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
                <span>Level {userStats.level}</span>
                <span>{progress}/100 XP</span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden">

                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-4 rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div className="bg-orange-50 dark:bg-amber-950/40 rounded-2xl p-4 border border-orange-100 dark:border-amber-800/40">

                <p className="text-gray-500 dark:text-slate-400">
                  🪙 Coins
                </p>

                <p className="text-2xl font-bold text-orange-600 dark:text-amber-400 mt-1">
                  {userStats.coins}
                </p>

              </div>

              <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4 border border-red-100 dark:border-red-800/40">

                <p className="text-gray-500 dark:text-slate-400">
                  🔥 Streak
                </p>

                <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">
                  {userStats.streak}
                </p>

              </div>

            </div>

          </div>

          {/* Right Side */}

          <div className="flex justify-center">
            <PandaAvatar level={userStats.level} />
          </div>

        </div>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatsCard
          title="📋 Total Tasks"
          value={stats.total}
          color="text-indigo-600"
        />

        <StatsCard
          title="✅ Completed"
          value={stats.completed}
          color="text-green-600"
        />

        <StatsCard
          title="⏳ Pending"
          value={stats.pending}
          color="text-orange-500"
        />

        <StatsCard
          title="📈 Completion"
          value={`${stats.completionRate}%`}
          color="text-purple-600"
        />

      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        <ProductivityChart />

        <RecentTasks />

      </div>

    </MainLayout>
  );
}

export default Dashboard;