import { useState, useMemo } from "react";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
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
import { getAuthErrorMessage } from "../../utils/authErrors";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import MainLayout from "../../layouts/MainLayout";

const avatars = ["🐼", "🐱", "🐶", "🐻", "🐬", "🦁", "🐅", "🐰", "🦊"];

const MIN_PASSWORD_LENGTH = 6;

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
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
    // A saved choice wins; otherwise fall back to the equipped companion.
    if (typeof user?.avatarIndex === "number" && avatars[user.avatarIndex]) {
      return user.avatarIndex;
    }
    const index = avatars.indexOf(getCompanionEmoji(equippedCompanion));
    return index !== -1 ? index : 1;
  }, [equippedCompanion, user?.avatarIndex]);

  // Preference Settings live on the user document so they follow the account
  // to any browser, rather than being stranded in one device's localStorage.
  const emailReminders = user?.prefEmailReminders ?? true;
  const taskDigest = user?.prefTaskDigest ?? true;
  const soundEffects = user?.prefSoundEffects ?? true;

  const [savingPref, setSavingPref] = useState(null);

  const togglePreference = async (key, nextValue) => {
    if (savingPref) return;

    setSavingPref(key);
    try {
      await updateProfile({ [key]: nextValue });
    } catch (error) {
      console.error("Could not save preference:", error);
      showToast("Could not save that preference.", "error");
    } finally {
      setSavingPref(null);
    }
  };

  const avatarIndex = avatarIndexOverride !== null ? avatarIndexOverride : currentAvatarIndex;

  const handleEditStart = () => {
    setEditName(user.fullName || "");
    setEditRole(user.role || "");
    setEditMajor(user.major || "");
    setEditBio(user.bio || "");
    setAvatarIndexOverride(currentAvatarIndex);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (savingProfile) return;

    setSavingProfile(true);

    try {
      await updateProfile({
        fullName: editName.trim(),
        role: editRole.trim(),
        major: editMajor.trim(),
        bio: editBio.trim(),
        // Previously dropped on save, so a picked avatar silently reverted.
        avatarIndex,
      });
      setIsEditing(false);
      setAvatarIndexOverride(null);
      showToast("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("Failed to save profile changes.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (changingPassword) return;

    if (!currentPassword) {
      showToast("Please enter your current password.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match!", "error");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      showToast(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "error");
      return;
    }

    const currentUser = auth.currentUser;

    // Reporting success with no signed-in user told people their password had
    // changed when nothing had happened.
    if (!currentUser?.email) {
      showToast("Your session has expired. Please log in again.", "error");
      return;
    }

    setChangingPassword(true);

    try {
      // The current password is actually checked now. Before, the field was
      // collected and never used, implying a verification that never ran.
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      await updatePassword(currentUser, newPassword);

      showToast("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      showToast(getAuthErrorMessage(error), "error");
    } finally {
      setChangingPassword(false);
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
      <div className="w-full max-w-7xl mx-auto py-2 sm:py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight">
            👤 Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage your account preferences, gamification stats, and productivity dashboard options.
          </p>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 px-4 sm:px-6 py-3 sm:py-4 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl flex items-center gap-2.5 sm:gap-3 border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              toastMessage.type === "success"
                ? "bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            }`}
          >
            <CheckCircle size={18} className="flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{toastMessage.text}</span>
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          
          {/* Profile Hero Card */}
          <div className="glass-premium rounded-2xl sm:rounded-[32px] p-5 sm:p-8 shadow-sm relative overflow-hidden transition-colors duration-300">
            <div className="absolute right-4 sm:right-8 top-4 sm:top-8 text-6xl sm:text-8xl opacity-5 select-none pointer-events-none">
              {companionEmoji}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Avatar and Details */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                <div className="relative group flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-4xl sm:text-5xl flex items-center justify-center border-2 border-indigo-500/20 shadow-inner select-none">
                    {avatars[avatarIndex]}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setAvatarIndexOverride((prev) => ((prev !== null ? prev : currentAvatarIndex) + 1) % avatars.length)}
                      className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition cursor-pointer"
                      title="Change avatar"
                      aria-label="Change avatar"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>

                <div className="text-center sm:text-left flex-1 min-w-0 w-full">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap justify-center sm:justify-start">
                        <input
                          type="text"
                          id="profile-name"
                          aria-label="Full name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base sm:text-xl px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                        />
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          aria-busy={savingProfile}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-sm text-xs cursor-pointer active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Save size={12} /> {savingProfile ? "Saving..." : "Save"}
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                        <input
                          type="text"
                          id="profile-role"
                          aria-label="Student role"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Student Role"
                          className="bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                        />
                        <input
                          type="text"
                          id="profile-major"
                          aria-label="Major field"
                          value={editMajor}
                          onChange={(e) => setEditMajor(e.target.value)}
                          placeholder="Major Field"
                          className="bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                        />
                      </div>
                      <input
                        type="text"
                        id="profile-bio"
                        aria-label="Short bio"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Bio"
                        className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap justify-center sm:justify-start">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-50 tracking-tight">
                          {user.fullName || "Productive Student"}
                        </h2>
                        <button
                          onClick={handleEditStart}
                          className="flex items-center justify-center gap-1.5 bg-indigo-500/10 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer hover:bg-indigo-500/20 active:scale-95"
                        >
                          <Edit2 size={12} /> Edit Profile
                        </button>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 font-semibold">
                        {user.role || "Student"} • <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.major || "Major"}</span>
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
                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-indigo-500/10">
                  <Trophy size={12} /> Level {calculatedLevel} Scholar
                </span>
                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-purple-500/10">
                  🐾 Theme: {equippedCompanion}
                </span>
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-500/10">
                  <Coins size={12} /> {coins} Coins
                </span>
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-red-500/10">
                  <Flame size={12} /> {streak} Day Streak
                </span>
              </div>

            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="flex border-b border-gray-100 dark:border-slate-800 gap-4 sm:gap-6 text-xs sm:text-sm pb-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`whitespace-nowrap transition pb-2.5 sm:pb-3 cursor-pointer ${
                activeTab === "stats"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              Gamification & Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`whitespace-nowrap transition pb-2.5 sm:pb-3 cursor-pointer ${
                activeTab === "preferences"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              Account Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`whitespace-nowrap transition pb-2.5 sm:pb-3 cursor-pointer ${
                activeTab === "security"
                  ? "text-slate-900 dark:text-white font-black border-b-2 border-indigo-500"
                  : "text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              Security & Privacy
            </button>
          </div>

          {/* Tab Body */}
          <div>
            
            {/* Tab 1: Stats & Gamification */}
            {activeTab === "stats" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                
                {/* Left stats cards - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm">
                      <span className="text-gray-400 text-[11px] sm:text-xs block">Tasks Completed</span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2">
                        {completedTasksCount}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm">
                      <span className="text-gray-400 text-[11px] sm:text-xs block">Study Hours</span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400 mt-1 sm:mt-2">
                        {studyHours}h
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm">
                      <span className="text-gray-400 text-[11px] sm:text-xs block">Streak Milestone</span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-red-500 dark:text-red-400 mt-1 sm:mt-2">{streak} days</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm">
                      <span className="text-gray-400 text-[11px] sm:text-xs block">Scholar Grade</span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1 sm:mt-2">Level {calculatedLevel}</p>
                    </div>
                  </div>

                  {/* XP Progression Card */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">Level XP Progression</h4>
                      <span className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}% to level up</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 sm:h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Right stats card - 1/3 width */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-6 shadow-sm text-center">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Active Companion</h4>
                    <div className="text-5xl sm:text-7xl my-4 sm:my-6 select-none animate-bounce">{companionEmoji}</div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg">{equippedCompanion}</h3>
                    <p className="text-xs text-gray-500 mt-1">Ready to assist you in work sessions.</p>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Preferences */}
            {activeTab === "preferences" && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                
                {/* Theme toggles card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-6">Workspace Themes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    
                    {/* Dark/Light mode toggle card */}
                    <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Color Mode</h4>
                        <p className="text-xs text-gray-400 mt-1">Switch between light or dark viewports.</p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className="p-3 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors duration-200"
                        title="Toggle Dark/Light Mode"
                        aria-label="Toggle Dark/Light Mode"
                      >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                    </div>

                    {/* Companion Theme display card */}
                    <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Companion Theme</h4>
                        <p className="text-xs text-gray-400 mt-1">Select animal in Companion tab.</p>
                      </div>
                      <div className="text-base sm:text-xl font-bold bg-white dark:bg-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                        {equippedCompanion} {companionEmoji}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Workspace Preferences card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Workspace Preferences</h3>
                  
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    
                    {/* Email Reminders Row */}
                    <div className="flex items-center justify-between py-3.5 sm:py-4 gap-3 last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">Email Reminders</span>
                        <span className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Receive email notifications for due tasks.
                        </span>
                      </div>
                      <div className="flex-shrink-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() => togglePreference("prefEmailReminders", !emailReminders)}
                          role="switch"
                          aria-checked={emailReminders}
                          aria-label="Toggle Email Reminders"
                          disabled={savingPref === "prefEmailReminders"}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            emailReminders ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-800"
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
                    <div className="flex items-center justify-between py-3.5 sm:py-4 gap-3 last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">Daily Task Digest</span>
                        <span className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Get a morning recap of your active scheduler.
                        </span>
                      </div>
                      <div className="flex-shrink-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() => togglePreference("prefTaskDigest", !taskDigest)}
                          role="switch"
                          aria-checked={taskDigest}
                          aria-label="Toggle Daily Task Digest"
                          disabled={savingPref === "prefTaskDigest"}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            taskDigest ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-800"
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
                    <div className="flex items-center justify-between py-3.5 sm:py-4 gap-3 last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">Sound Effects</span>
                        <span className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5 block leading-relaxed">
                          Play audio feedback when earning coins or leveling up.
                        </span>
                      </div>
                      <div className="flex-shrink-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() => togglePreference("prefSoundEffects", !soundEffects)}
                          role="switch"
                          aria-checked={soundEffects}
                          aria-label="Toggle Sound Effects"
                          disabled={savingPref === "prefSoundEffects"}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            soundEffects ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-800"
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
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 shadow-sm max-w-xl mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600 dark:text-indigo-400" /> Security Settings
                </h3>

                <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="profile-current-password" className="block mb-1.5 sm:mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                    <input
                      id="profile-current-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-new-password" className="block mb-1.5 sm:mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                    <input
                      id="profile-new-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={MIN_PASSWORD_LENGTH}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-confirm-password" className="block mb-1.5 sm:mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      id="profile-confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={MIN_PASSWORD_LENGTH}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    aria-busy={changingPassword}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 sm:py-3.5 rounded-xl transition cursor-pointer text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
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