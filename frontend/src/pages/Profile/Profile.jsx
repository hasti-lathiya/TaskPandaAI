import { useEffect, useState, useMemo } from "react";
import { updatePassword } from "firebase/auth";
import {
  Lock,
  Edit2,
  Save,
  CheckCircle,
  Trophy,
  Moon,
  Sun,
  Flame,
  Coins,
} from "lucide-react";
import { auth } from "../../firebase/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import MainLayout from "../../layouts/MainLayout";

const avatars = ["🐼", "🐱", "🐶", "🐻", "🐬", "🦁", "🐅", "🐰", "🦊"];

function Profile() {
  const { darkMode, toggleDarkMode, equippedCompanion } = useTheme();
  const { user, tasks, coins, streak, xp, studyHours, updateProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");

  // Edit Profile States
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editMajor, setEditMajor] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarIndexOverride, setAvatarIndexOverride] = useState(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Preference Settings (loaded from localStorage or default)
  const [emailReminders, setEmailReminders] = useState(() => {
    const saved = localStorage.getItem("pref_email_reminders");
    return saved ? saved === "true" : true;
  });
  const [taskDigest, setTaskDigest] = useState(() => {
    const saved = localStorage.getItem("pref_task_digest");
    return saved ? saved === "true" : true;
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    const saved = localStorage.getItem("pref_sound_effects");
    return saved ? saved === "true" : true;
  });

  const showToast = (message, type = "success") => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  function getCompanionEmoji(companion) {
    switch (companion) {
      case "Cat": return "🐱";
      case "Dog": return "🐶";
      case "Bear": return "🐻";
      case "Dolphin": return "🐬";
      case "Lion": return "🦁";
      case "Tiger": return "🐅";
      case "Rabbit": return "🐰";
      case "Fox": return "🦊";
      default: return "🐼";
    }
  }

  const currentAvatarIndex = useMemo(() => {
    const index = avatars.indexOf(getCompanionEmoji(equippedCompanion));
    return index !== -1 ? index : 1;
  }, [equippedCompanion]);

  const avatarIndex = avatarIndexOverride !== null ? avatarIndexOverride : currentAvatarIndex;

  // Persist preference switches
  useEffect(() => {
    localStorage.setItem("pref_email_reminders", emailReminders.toString());
  }, [emailReminders]);

  useEffect(() => {
    localStorage.setItem("pref_task_digest", taskDigest.toString());
  }, [taskDigest]);

  useEffect(() => {
    localStorage.setItem("pref_sound_effects", soundEffects.toString());
  }, [soundEffects]);

  const handleEditStart = () => {
    setEditName(user.fullName || "");
    setEditRole(user.role || "");
    setEditMajor(user.major || "");
    setEditBio(user.bio || "");
    setAvatarIndexOverride(currentAvatarIndex);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        fullName: editName.trim(),
        role: editRole.trim(),
        major: editMajor.trim(),
        bio: editBio.trim(),
      });
      setIsEditing(false);
      setAvatarIndexOverride(null);
      showToast("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("Failed to save profile changes.", "error");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match!", "error");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Password updated successfully! (Sandbox Mock)");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        return;
      }

      await updatePassword(currentUser, newPassword);
      showToast("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/requires-recent-login") {
        showToast("Please log out and log back in before updating password.", "error");
      } else {
        showToast("Failed to update password.", "error");
      }
    }
  };

  const companionEmoji = useMemo(() => getCompanionEmoji(equippedCompanion), [equippedCompanion]);
  
  // Calculate dynamic stats
  const completedTasksCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  
  // Dynamic level: e.g. Level = floor(xp / 100) + 1
  const calculatedLevel = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const progress = useMemo(() => xp % 100, [xp]);

  return (
    <MainLayout>
      <div className="pt-8 px-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden transition-all duration-300">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight">
            👤 Profile & Settings
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Manage your account preferences, gamification stats, and productivity dashboard options.
          </p>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              toastMessage.type === "success"
                ? "bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            }`}
          >
            <CheckCircle size={18} />
            <span className="text-sm font-bold">{toastMessage.text}</span>
          </div>
        )}

        <div className="space-y-8">
          
          {/* Profile Hero Card */}
          <div className="glass-premium rounded-[32px] p-8 shadow-sm relative overflow-hidden transition-colors duration-300">
            <div className="absolute right-8 top-8 text-8xl opacity-5 select-none pointer-events-none">
              {companionEmoji}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Avatar and Details */}
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-5xl flex items-center justify-center border-2 border-indigo-500/20 shadow-inner select-none">
                    {avatars[avatarIndex]}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setAvatarIndexOverride((prev) => ((prev !== null ? prev : currentAvatarIndex) + 1) % avatars.length)}
                      className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition cursor-pointer"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>

                <div className="text-center sm:text-left flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3.5 flex-wrap justify-center sm:justify-start">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-105 font-extrabold text-xl px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm text-xs cursor-pointer active:scale-95 transition"
                        >
                          <Save size={12} /> Save
                        </button>
                      </div>
                      <div className="flex gap-2 justify-center sm:justify-start">
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Student Role"
                          className="bg-slate-50 dark:bg-slate-850 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                        />
                        <input
                          type="text"
                          value={editMajor}
                          onChange={(e) => setEditMajor(e.target.value)}
                          placeholder="Major Field"
                          className="bg-slate-50 dark:bg-slate-850 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Bio"
                        className="w-full max-w-sm bg-slate-50 dark:bg-slate-850 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3.5 flex-wrap justify-center sm:justify-start">
                        <h2 className="text-3xl font-black text-slate-805 dark:text-slate-50 tracking-tight">
                          {user.fullName || "Productive Student"}
                        </h2>
                        <button
                          onClick={handleEditStart}
                          className="flex items-center justify-center gap-1.5 bg-indigo-500/10 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer hover:bg-indigo-500/20 active:scale-95"
                        >
                          <Edit2 size={12} /> Edit Profile
                        </button>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-semibold">
                        {user.role || "Student"} • <span className="font-bold text-indigo-650 dark:text-indigo-455">{user.major || "Major"}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-sm italic font-medium">
                        "{user.bio || "Growing day by day."}"
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Right Area - Stats Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-end md:max-w-md w-full md:w-auto">
                <span className="bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-indigo-500/10">
                  <Trophy size={12} /> Level {calculatedLevel} Scholar
                </span>
                <span className="bg-purple-500/10 text-purple-655 dark:text-purple-400 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-purple-500/10">
                  🐾 Theme: {equippedCompanion}
                </span>
                <span className="bg-amber-500/10 text-amber-650 dark:text-amber-405 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-500/10">
                  <Coins size={12} /> {coins} Coins
                </span>
                <span className="bg-red-500/10 text-red-655 dark:text-red-400 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-red-500/10">
                  <Flame size={12} /> {streak} Day Streak
                </span>
              </div>

            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="flex border-b border-gray-150 dark:border-slate-800 gap-6 text-sm pb-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`transition pb-3 text-sm cursor-pointer ${
                activeTab === "stats"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-350"
              }`}
            >
              Gamification & Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`transition pb-3 text-sm cursor-pointer ${
                activeTab === "preferences"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-350"
              }`}
            >
              Account Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`transition pb-3 text-sm cursor-pointer ${
                activeTab === "security"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-350"
              }`}
            >
              Security & Privacy
            </button>
          </div>

          {/* Tab Body */}
          <div>
            
            {/* Tab 1: Stats & Gamification */}
            {activeTab === "stats" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left stats cards - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                      <span className="text-gray-400 text-xs block">Tasks Completed</span>
                      <p className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 mt-2">
                        {completedTasksCount}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                      <span className="text-gray-400 text-xs block">Study Hours</span>
                      <p className="text-3xl font-extrabold text-amber-550 dark:text-amber-400 mt-2">
                        {studyHours}h
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                      <span className="text-gray-400 text-xs block">Streak Milestone</span>
                      <p className="text-3xl font-extrabold text-red-550 dark:text-red-400 mt-2">{streak} days</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                      <span className="text-gray-400 text-xs block">Scholar Grade</span>
                      <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">Level {calculatedLevel}</p>
                    </div>
                  </div>

                  {/* XP Progression Card */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm">Level XP Progression</h4>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}% to level up</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-650 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Right stats card - 1/3 width */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-800 rounded-[32px] p-6 shadow-sm text-center">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Active Companion</h4>
                    <div className="text-7xl my-6 select-none animate-bounce">{companionEmoji}</div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{equippedCompanion}</h3>
                    <p className="text-xs text-gray-500 mt-1">Ready to assist you in work sessions.</p>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Preferences */}
            {activeTab === "preferences" && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                
                {/* Theme toggles card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Workspace Themes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Dark/Light mode toggle card */}
                    <div className="bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-5 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Color Mode</h4>
                        <p className="text-xs text-gray-400 mt-1">Switch between light or dark viewports.</p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 text-indigo-650 dark:text-indigo-400 cursor-pointer"
                      >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                    </div>

                    {/* Companion Theme display card */}
                    <div className="bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-5 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Companion Theme</h4>
                        <p className="text-xs text-gray-400 mt-1">Select animal to apply custom palette.</p>
                      </div>
                      <div className="text-xl font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                        {equippedCompanion} {companionEmoji}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Workspace Preferences card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Workspace Preferences</h3>
                  
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    
                    {/* Email Reminders Row */}
                    <div className="flex items-center justify-between py-4 last:border-0">
                      <div className="w-4/5 pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">Email Reminders</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Receive email notifications for due tasks.
                        </span>
                      </div>
                      <div className="w-1/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEmailReminders(!emailReminders)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            emailReminders ? "bg-indigo-650" : "bg-gray-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              emailReminders ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Daily Task Digest Row */}
                    <div className="flex items-center justify-between py-4 last:border-0">
                      <div className="w-4/5 pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">Daily Task Digest</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Get a morning recap of your active scheduler.
                        </span>
                      </div>
                      <div className="w-1/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setTaskDigest(!taskDigest)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            taskDigest ? "bg-indigo-650" : "bg-gray-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              taskDigest ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Sound Effects Row */}
                    <div className="flex items-center justify-between py-4 last:border-0">
                      <div className="w-4/5 pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">Sound Effects</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Play audio feedback when earning coins or leveling up.
                        </span>
                      </div>
                      <div className="w-1/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSoundEffects(!soundEffects)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            soundEffects ? "bg-indigo-650" : "bg-gray-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              soundEffects ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: Security & Privacy */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-[32px] p-8 shadow-sm max-w-xl mx-auto">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600 dark:text-indigo-400" /> Security Settings
                </h3>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition cursor-pointer text-sm shadow-md"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </MainLayout>
  );
}

export default Profile;