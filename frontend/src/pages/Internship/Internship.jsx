import { useEffect, useState, useMemo, useRef } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import MainLayout from "../../layouts/MainLayout";
import DailyWorkLog from "./DailyWorkLog";
import HoursTracker from "./HoursTracker";
import WeeklyProgress from "./WeeklyProgress";
import TaskCompletionTracker from "./TaskCompletionTracker";
import MentorFeedback from "./MentorFeedback";
import MonthlyReport from "./MonthlyReport";
import InternshipGoals from "./InternshipGoals";
import { generateInternshipReport } from "../../services/gemini";
import { useNotifications } from "../../context/NotificationContext";
import { awardXpOnce, getISOWeekString } from "../../services/rewards";
import { runAchievementChecks } from "../../services/achievements";

function Internship() {
  const { addNotification } = useNotifications();
  const [todayHours, setTodayHours] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [daysAttended, setDaysAttended] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);

  const [weeklyTasks, setWeeklyTasks] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  
  const progressRate = useMemo(() => {
    const goalHours = todayHours >= 8;
    const completedGoals = Number(goalHours) + Number(loggedToday) + Number(completedToday);
    return Math.round((completedGoals / 3) * 100);
  }, [todayHours, loggedToday, completedToday]);

  const rightColRef = useRef(null);

  // Synchronize the right-side sticky cards with the main scroll progress
  // so that when the left side reaches 100% bottom, the right side is also
  // 100% scrolled and cards are never left half-scrolled or cut off.
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const handleScroll = () => {
      const rightCol = rightColRef.current;
      if (!rightCol) return;

      if (window.innerWidth < 1024) return;

      const maxScrollMain = mainEl.scrollHeight - mainEl.clientHeight;
      if (maxScrollMain <= 0) return;

      const scrollRatio = mainEl.scrollTop / maxScrollMain;
      const maxScrollRight = rightCol.scrollHeight - rightCol.clientHeight;

      if (maxScrollRight > 0) {
        rightCol.scrollTop = scrollRatio * maxScrollRight;
      }
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainEl.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeTasks = null;
    let unsubscribeLogs = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          const data = userSnap.data();
          const today = new Date().toISOString().split("T")[0];

          // todayHours is only "today's" if it was last written today —
          // otherwise yesterday's total would linger indefinitely.
          setTodayHours(data.lastUpdatedDate === today ? data.todayHours || 0 : 0);
        }
      });

      // Subscribe to tasks to find completed ones
      const taskQuery = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );
      unsubscribeTasks = onSnapshot(taskQuery, (taskSnap) => {
        let completedCount = 0;
        let compToday = false;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        taskSnap.forEach((taskDoc) => {
          const t = taskDoc.data();
          if (!t.completed) return;

          completedCount++;

          // Only a task finished since midnight counts toward today's goal.
          // Tasks completed before completedAt was recorded simply don't
          // qualify, which is the correct answer for "was this done today?".
          if (t.completedAt) {
            const completedDate = t.completedAt.toDate
              ? t.completedAt.toDate()
              : new Date(t.completedAt);
            if (completedDate >= startOfDay) compToday = true;
          }
        });

        setCompletedTasks(completedCount);
        setCompletedToday(compToday);
      });

      // Subscribe to daily work logs to calculate attendance and logged today
      const logQuery = query(
        collection(db, "internshipLogs"),
        where("userId", "==", user.uid)
      );
      unsubscribeLogs = onSnapshot(logQuery, (logSnap) => {
        const dates = new Set();
        let logToday = false;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        logSnap.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            const dateVal = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            dates.add(dateVal.toDateString());
            if (dateVal >= startOfDay) {
              logToday = true;
            }
          }
        });
        setDaysAttended(dates.size);
        setLoggedToday(logToday);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeLogs) unsubscribeLogs();
    };
  }, []);

  const generateWeeklyReport = async () => {
    if (!weeklyTasks.trim()) {
      setReportError("Please enter your completed work details first.");
      return;
    }

    try {
      setReportError("");
      setLoadingReport(true);
      setGeneratedReport("");

      const report = await generateInternshipReport(weeklyTasks);
      setGeneratedReport(report);

      const userId = auth.currentUser?.uid;
      if (userId) {
        const weekIdentifier = getISOWeekString();

        // Persist the report so it counts toward the Internship Hero
        // achievement and survives refresh/login.
        await addDoc(collection(db, "internshipReports"), {
          userId,
          content: report,
          weekIdentifier,
          createdAt: serverTimestamp(),
        });

        // +30 XP once per calendar week, no matter how many times the
        // report is regenerated that week.
        const { awarded } = await awardXpOnce(userId, {
          xp: 30,
          reason: "Internship weekly report",
          uniqueRewardId: `internship-report-${weekIdentifier}`,
        });

        if (awarded) {
          await addNotification("Report Generated! 📋", "Internship weekly report saved. Earned +30 XP", "gamification");
        }

        runAchievementChecks(userId, { addNotification }).catch((err) =>
          console.error("Achievement check failed:", err)
        );
      }

    } catch (error) {
      console.error(error);
      setGeneratedReport("Failed to generate report.");
    } finally {
      setLoadingReport(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight">
            💼 Internship Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-300 mt-1 text-sm font-semibold">
            Track your internship progress, daily work hours, and generate AI-guided weekly reports.
          </p>
        </div>

        {/* Hero Card Banner */}
        <div className="glass-premium rounded-[32px] p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                🚀 Keep Growing Every Day
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl font-medium">
                Small consistent improvements every day lead to a highly successful internship outcome.
              </p>
              <p className="mt-5 font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                📅 {today}
              </p>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/60 flex items-center justify-center text-4xl shadow-inner border border-indigo-500/10 dark:border-indigo-950/30 flex-shrink-0 select-none">
              💼
            </div>
          </div>
        </div>

        {/* Key Metrics Grid (4-Column Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-premium glass-hover rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                ⏰ Hours Today
              </h3>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-3">
                {todayHours} / 8
              </p>
            </div>
            <div className="mt-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/10 dark:border-slate-800/40">
              <div
                className="h-1.5 bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((todayHours / 8) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass-premium glass-hover rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                📋 Tasks Completed
              </h3>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-3">
                {completedTasks}
              </p>
            </div>
            <div className="mt-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/10 dark:border-slate-800/40">
              <div className="h-1.5 bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completedTasks > 0 ? 100 : 0}%` }} />
            </div>
          </div>

          <div className="glass-premium glass-hover rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                📅 Days Attended
              </h3>
              <p className="text-3xl font-extrabold text-orange-500 dark:text-orange-400 mt-3">
                {daysAttended}
              </p>
            </div>
            <div className="mt-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/10 dark:border-slate-800/40">
              <div className="h-1.5 bg-orange-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${daysAttended > 0 ? 100 : 0}%` }} />
            </div>
          </div>

          <div className="glass-premium glass-hover rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                📈 Progress
              </h3>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-3">
                {progressRate}%
              </p>
            </div>
            <div className="mt-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/10 dark:border-slate-800/40">
              <div className="h-1.5 bg-purple-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressRate}%` }} />
            </div>
          </div>
        </div>

        {/* 2-Column Split Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (2/3 Width) - Work Log and Reports */}
          <div className="lg:col-span-2 space-y-8">
            <DailyWorkLog />

            {/* AI Weekly Report Generator Card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm transition-colors duration-300">
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                🤖 AI Weekly Report Generator
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Input your key activities below to generate a formatted weekly status report for your manager or mentor.
              </p>

              <label htmlFor="weekly-tasks" className="sr-only">
                Completed work details for this week
              </label>

              <textarea
                id="weekly-tasks"
                value={weeklyTasks}
                onChange={(e) => setWeeklyTasks(e.target.value)}
                aria-invalid={Boolean(reportError)}
                placeholder="Example:&#10;• Created Login Page&#10;• Integrated Firebase Authentication&#10;• Fixed Sidebar Bugs"
                className="w-full bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 h-36 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              />

              {reportError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {reportError}
                </p>
              )}

              <button
                onClick={generateWeeklyReport}
                disabled={loadingReport}
                aria-busy={loadingReport}
                className="mt-4 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition cursor-pointer text-sm disabled:opacity-50"
              >
                {loadingReport ? "Generating AI report..." : "Generate Weekly Report"}
              </button>

              {generatedReport && (
                <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                  <h3 className="font-extrabold text-sm text-indigo-700 dark:text-indigo-400 mb-3 uppercase tracking-wider">
                    🐼 Generated Report
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                    {generatedReport}
                  </p>
                </div>
              )}
            </div>

            <WeeklyProgress todayHours={todayHours} />
            <TaskCompletionTracker />
            <MonthlyReport />
          </div>

          {/* Right Column (1/3 Width) - Settings and Quick Inputs (Synchronized sticky scroll) */}
          <div
            ref={rightColRef}
            className="space-y-6 lg:sticky lg:top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-hidden scrollbar-none pb-2"
          >
            <HoursTracker todayHours={todayHours} setTodayHours={setTodayHours} />
            <InternshipGoals />
            <MentorFeedback />
          </div>

        </div>
        
      </div>
    </MainLayout>
  );
}

export default Internship;