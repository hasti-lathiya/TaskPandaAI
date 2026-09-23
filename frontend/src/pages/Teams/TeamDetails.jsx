import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import {
  Plus,
  Calendar,
  MessageSquare,
  Star,
  Video,
  Award,
  ArrowLeft,
  Loader2,
  Sparkles,
  Settings,
  Trash2,
} from "lucide-react";
import { db, auth } from "../../firebase/firebase";
import MainLayout from "../../layouts/MainLayout";
import { recommendTeamAssignee } from "../../services/gemini";
import { runAchievementChecks } from "../../services/achievements";
import { awardXpOnce } from "../../services/rewards";
import { isValidEmail } from "../../utils/validation";
import { useNotifications } from "../../context/NotificationContext";

function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks"); // tasks | members

  // Modal States
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Create Task Form States
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Comment Form State
  const [newComment, setNewComment] = useState("");

  // Review / Rating States
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  // Edit / Delete Team States
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState([]);
  const [newEditMemberEmail, setNewEditMemberEmail] = useState("");
  const [newEditMemberRole, setNewEditMemberRole] = useState("internal");

  // In-flight guards and user-visible feedback (replacing native dialogs)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [banner, setBanner] = useState("");

  // Filtering states
  const [taskSearch, setTaskSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");

  const showBanner = (message) => {
    setBanner(message);
    setTimeout(() => setBanner(""), 5000);
  };

  // Live subscriptions: this is the one genuinely collaborative screen, so a
  // teammate's comment, status change or new task should appear without a
  // manual reload.
  useEffect(() => {
    let unsubTeam = null;
    let unsubTasks = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubTeam) unsubTeam();
      if (unsubTasks) unsubTasks();

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      unsubTeam = onSnapshot(
        doc(db, "teams", teamId),
        (teamSnap) => {
          if (!teamSnap.exists()) {
            navigate("/teams", {
              replace: true,
              state: { notice: "That team no longer exists." },
            });
            return;
          }

          const teamData = teamSnap.data();
          const email = (user.email || "").toLowerCase();
          const isMember =
            teamData.createdBy === user.uid ||
            teamData.memberEmails?.includes(email);

          if (!isMember) {
            navigate("/teams", {
              replace: true,
              state: { notice: "You do not have access to that team." },
            });
            return;
          }

          setTeam({ id: teamSnap.id, ...teamData });
          setLoading(false);
        },
        (err) => {
          console.error("Error loading team:", err);
          setActionError("Could not load this team. Please try again.");
          setLoading(false);
        }
      );

      unsubTasks = onSnapshot(
        query(collection(db, "teamTasks"), where("teamId", "==", teamId)),
        (tasksSnap) => {
          const list = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setTasks(list);

          // Keep an open task modal in step with incoming changes.
          setSelectedTask((current) =>
            current ? list.find((t) => t.id === current.id) || current : current
          );
        },
        (err) => {
          console.error("Error loading team tasks:", err);
          setActionError("Could not load this team's tasks.");
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubTeam) unsubTeam();
      if (unsubTasks) unsubTasks();
    };
  }, [teamId, navigate]);

  // Generate AI Recommendation
  const handleGetAiRecommendation = async () => {
    if (!taskTitle.trim()) {
      setActionError("Please enter a task title first.");
      return;
    }
    try {
      setAiLoading(true);
      setAiRecommendation("");

      // Calculate workload (active tasks count) per member
      const activeTasksCount = {};
      team.members.forEach((m) => {
        activeTasksCount[m.email] = 0;
      });

      tasks.forEach((t) => {
        if (t.status !== "completed" && t.assignedTo) {
          activeTasksCount[t.assignedTo] = (activeTasksCount[t.assignedTo] || 0) + 1;
        }
      });

      const rec = await recommendTeamAssignee(
        taskTitle,
        taskDesc,
        team.members,
        activeTasksCount
      );
      setAiRecommendation(rec);
    } catch (err) {
      console.error(err);
      setAiRecommendation("Failed to get recommendation.");
    } finally {
      setAiLoading(false);
    }
  };

  // Create Team Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (creatingTask) return;

    if (!taskTitle.trim() || !taskAssignee) {
      setActionError("A title and an assignee are required.");
      return;
    }

    setActionError("");
    setCreatingTask(true);

    try {
      await addDoc(collection(db, "teamTasks"), {
        teamId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedTo: taskAssignee,
        dueDate: taskDueDate,
        status: "pending",
        createdAt: serverTimestamp(),
        comments: [],
      });

      showBanner("🎉 Team task created.");
      setTaskTitle("");
      setTaskDesc("");
      setTaskAssignee("");
      setTaskDueDate("");
      setAiRecommendation("");
      setCreateTaskOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
      setActionError("Could not create that task. Please try again.");
    } finally {
      setCreatingTask(false);
    }
  };

  // Add Comment to Task
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask || postingComment) return;

    setPostingComment(true);
    setActionError("");

    try {
      const user = auth.currentUser;
      const commentObj = {
        sender: user.displayName || user.email,
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      };

      const taskRef = doc(db, "teamTasks", selectedTask.id);
      await updateDoc(taskRef, {
        comments: arrayUnion(commentObj),
      });

      const updatedTask = {
        ...selectedTask,
        comments: [...(selectedTask.comments || []), commentObj],
      };
      setSelectedTask(updatedTask);
      setTasks(tasks.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setActionError("Your comment couldn't be posted. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId, newStatus) => {
    if (statusUpdatingId) return;

    setStatusUpdatingId(taskId);
    setActionError("");

    try {
      const taskRef = doc(db, "teamTasks", taskId);
      const taskObj = tasks.find((t) => t.id === taskId);

      // The status itself is just a field — setting it is idempotent and safe
      // to repeat. The reward is what must never repeat, so it is guarded
      // separately below rather than by "is this task currently completed?".
      await updateDoc(taskRef, { status: newStatus });

      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      if (newStatus !== "completed") return;

      const assignee = taskObj?.assignedTo;
      if (!assignee) return;

      const userSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", assignee.toLowerCase()))
      );

      if (userSnap.empty) {
        // Previously this case silently skipped the guarded path entirely.
        setActionError(
          `${assignee} hasn't signed up yet, so no reward was granted for this task.`
        );
        return;
      }

      const assigneeUid = userSnap.docs[0].id;

      // Security rules forbid writing another user's document, so a reward can
      // only be granted to yourself. In practice the assignee marks their own
      // work complete and this is the normal path; when someone else closes
      // the task we say plainly that the reward is still pending.
      if (assigneeUid !== auth.currentUser?.uid) {
        showBanner(
          `Marked complete. ${assignee} earns the reward when they mark it complete themselves.`
        );
        return;
      }

      // awardXpOnce records a claim document keyed by uniqueRewardId, so this
      // task can be flipped between statuses any number of times and the
      // reward is still granted exactly once, ever.
      const { awarded } = await awardXpOnce(assigneeUid, {
        xp: 20,
        coins: 10,
        reason: "Team task completed",
        uniqueRewardId: `team-task-${taskId}`,
      });

      if (!awarded) {
        // Already rewarded on a previous completion — nothing more to do.
        return;
      }

      // Team Leader achievement belongs to the team's owner, who may
      // not be the person completing this task. Always recompute
      // their progress/unlock+XP correctly; only attach a live
      // toast/notification when the owner is the one currently
      // logged in (addNotification always attributes to the
      // logged-in user, so it can't correctly notify someone else).
      // The Team Leader achievement belongs to the team's owner. Recomputing
      // it writes to that owner's documents, which rules only permit for
      // yourself — so this runs only when the owner is the one completing.
      if (team?.createdBy && auth.currentUser?.uid === team.createdBy) {
        runAchievementChecks(team.createdBy, { addNotification }).catch((err) =>
          console.error("Achievement check failed:", err)
        );
      }

      showBanner("🏆 Task completed — you earned +20 XP and +10 Coins!");
    } catch (error) {
      console.error("Error updating status:", error);
      setActionError("Could not update that task. Please try again.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Review and Rate completed task
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedTask || savingReview) return;

    setSavingReview(true);
    setActionError("");

    try {
      const taskRef = doc(db, "teamTasks", selectedTask.id);
      await updateDoc(taskRef, {
        rating: Number(ratingScore),
        feedback: feedbackText.trim(),
        ratedBy: auth.currentUser.uid,
      });

      const updatedTask = {
        ...selectedTask,
        rating: Number(ratingScore),
        feedback: feedbackText.trim(),
        ratedBy: auth.currentUser.uid,
      };

      setSelectedTask(updatedTask);
      setTasks(tasks.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
      showBanner("⭐ Feedback and rating saved.");
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting review:", error);
      setActionError("Could not save your review. Please try again.");
    } finally {
      setSavingReview(false);
    }
  };

  // Team Settings Handlers
  const handleOpenSettings = () => {
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || "");
    setEditTeamMembers(team.members || []);
    setNewEditMemberEmail("");
    setSettingsModalOpen(true);
  };

  const handleAddMemberToEdit = () => {
    if (!newEditMemberEmail.trim()) return;

    const emailLower = newEditMemberEmail.trim().toLowerCase();

    if (!isValidEmail(emailLower)) {
      setActionError("Please enter a valid email address.");
      return;
    }

    if (editTeamMembers.some((m) => m.email === emailLower)) {
      setActionError("That member is already on the list.");
      return;
    }

    setActionError("");
    setEditTeamMembers([
      ...editTeamMembers,
      {
        email: emailLower,
        role: newEditMemberRole,
        uid: null,
      },
    ]);
    setNewEditMemberEmail("");
  };

  const handleRemoveMemberFromEdit = (email) => {
    const member = editTeamMembers.find((m) => m.email === email);
    if (member && member.role === "owner") {
      setActionError("The team owner can't be removed.");
      return;
    }
    setEditTeamMembers(editTeamMembers.filter((m) => m.email !== email));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (savingSettings) return;

    // The UI hides these controls from non-owners; checking here too means a
    // stale render or a devtools poke can't slip past.
    if (team?.createdBy !== auth.currentUser?.uid) {
      setActionError("Only the team owner can change these settings.");
      return;
    }

    if (!editTeamName.trim()) {
      setActionError("A team name is required.");
      return;
    }

    setActionError("");
    setSavingSettings(true);

    try {
      const teamRef = doc(db, "teams", teamId);
      const memberEmails = editTeamMembers.map((m) => m.email);

      await updateDoc(teamRef, {
        name: editTeamName.trim(),
        description: editTeamDesc.trim(),
        members: editTeamMembers,
        memberEmails: memberEmails,
      });

      showBanner("🎉 Team settings updated.");
      setSettingsModalOpen(false);
    } catch (err) {
      console.error("Error saving team settings:", err);
      setActionError("Could not update team settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (deletingTeam) return;

    if (team?.createdBy !== auth.currentUser?.uid) {
      setActionError("Only the team owner can delete this team.");
      return;
    }

    setDeletingTeam(true);
    setActionError("");

    try {
      const tasksSnap = await getDocs(
        query(collection(db, "teamTasks"), where("teamId", "==", teamId))
      );

      // Batched so the cascade commits as a unit. Deleting the tasks with
      // separate writes and the team afterwards could fail halfway and strand
      // tasks pointing at a team that no longer exists. Firestore caps a batch
      // at 500 writes, so large teams are chunked with the team document left
      // for the final batch.
      const BATCH_LIMIT = 500;
      const taskDocs = tasksSnap.docs;

      for (let i = 0; i < taskDocs.length; i += BATCH_LIMIT - 1) {
        const chunk = taskDocs.slice(i, i + BATCH_LIMIT - 1);
        const isLastChunk = i + BATCH_LIMIT - 1 >= taskDocs.length;
        const batch = writeBatch(db);

        chunk.forEach((taskDoc) => batch.delete(doc(db, "teamTasks", taskDoc.id)));
        if (isLastChunk) batch.delete(doc(db, "teams", teamId));

        await batch.commit();
      }

      // No tasks at all — the loop above never ran.
      if (taskDocs.length === 0) {
        const batch = writeBatch(db);
        batch.delete(doc(db, "teams", teamId));
        await batch.commit();
      }

      navigate("/teams", {
        replace: true,
        state: { notice: "Team and all its tasks were deleted." },
      });
    } catch (err) {
      console.error("Error deleting team:", err);
      setActionError("Could not delete the team. Please try again.");
      setConfirmDeleteOpen(false);
    } finally {
      setDeletingTeam(false);
    }
  };

  if (loading || !team) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
            <p className="text-gray-500 dark:text-slate-400 mt-4 font-semibold">
              Entering team workspace...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwner = team.createdBy === auth.currentUser?.uid;

  // Filter tasks based on status and search query / assignee selection
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(taskSearch.toLowerCase());
    const matchesMember = memberFilter === "All" || t.assignedTo === memberFilter;
    return matchesSearch && matchesMember;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const progressRate =
    tasks.length === 0
      ? 0
      : Math.round(
          (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
        );

  const jitsiMeetLink = `https://meet.jit.si/taskpanda-meet-${team.id}`;

  return (
    <MainLayout>

      {banner && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl mb-4 font-bold text-sm text-center shadow-sm"
        >
          {banner}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-4 font-bold text-sm text-center shadow-sm flex items-center justify-center gap-3"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss error"
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>
        </div>
      )}

      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-team-title"
        >
          <div
            className="absolute inset-0"
            onClick={() => !deletingTeam && setConfirmDeleteOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10">
            <h2
              id="delete-team-title"
              className="text-2xl font-bold text-slate-800 dark:text-slate-100"
            >
              Delete “{team.name}”?
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-3">
              This removes the team and all {tasks.length} of its tasks for every
              member. This can't be undone.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deletingTeam}
                className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={deletingTeam}
                aria-busy={deletingTeam}
                className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingTeam ? "Deleting..." : "Delete team"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-300 rounded-3xl">
        {/* Back Link */}
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-6"
        >
          <ArrowLeft size={16} /> Back to Teams
        </Link>

        {/* Team Header */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-300">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Team Workspace
            </span>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {team.name}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-xl">
              {team.description || "No description provided."}
            </p>
          </div>

          <div className="flex gap-3">
            {/* Jitsi Meet Conferencing Button */}
            <a
              href={jitsiMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 px-5 py-3 rounded-2xl font-semibold shadow-sm hover:scale-[1.02] transition"
            >
              <Video size={18} />
              Instant Meeting
            </a>

            <button
              onClick={() => setCreateTaskOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl font-semibold shadow-md hover:scale-[1.02] transition cursor-pointer"
            >
              <Plus size={18} />
              Assign Task
            </button>

            {isOwner && (
              <button
                onClick={handleOpenSettings}
                className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-5 py-3 rounded-2xl font-semibold shadow-sm hover:scale-[1.02] transition cursor-pointer"
              >
                <Settings size={18} />
                Manage Team
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs and Progress */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8 border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`pb-2 px-1 text-lg font-bold border-b-2 transition ${
                activeTab === "tasks"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              }`}
            >
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-2 px-1 text-lg font-bold border-b-2 transition ${
                activeTab === "members"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              }`}
            >
              Members ({team.members?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-96 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-sm transition-colors duration-300">
            <span className="text-sm font-semibold whitespace-nowrap">
              Progress: {progressRate}%
            </span>
            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-indigo-500 h-3.5 rounded-full transition-all duration-700"
                style={{ width: `${progressRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "tasks" ? (
          <>
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm transition-colors duration-300">
              <div className="flex-1">
                <input
                  aria-label="Search tasks"
                  type="text"
                  placeholder="🔍 Search tasks by title or description..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="w-full md:w-64">
                <select
                  aria-label="Filter tasks by assignee"
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option value="All">👤 Filter by Assignee: All</option>
                  {team.members?.map((m) => (
                    <option key={m.email} value={m.email}>
                      {m.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Style Tasks Board */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Pending Column */}
              <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">
                    Pending ⏳
                  </h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                    {pendingTasks.length}
                  </span>
                </div>

                {pendingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setTaskModalOpen(true);
                    }}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {t.title}
                      </h4>
                      <p className="text-gray-500 dark:text-slate-400 text-xs line-clamp-2 mb-4">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {t.assignedTo.split("@")[0]}
                        </span>
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {t.dueDate}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(t.id, "in_progress");
                        }}
                        className="w-full mt-1 text-center text-xs bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Start Task 🚀
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* In Progress Column */}
              <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100/60 dark:border-indigo-900/40">
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300">
                    In Progress 🚀
                  </h3>
                  <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-bold">
                    {inProgressTasks.length}
                  </span>
                </div>

                {inProgressTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setTaskModalOpen(true);
                    }}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {t.title}
                      </h4>
                      <p className="text-gray-500 dark:text-slate-400 text-xs line-clamp-2 mb-4">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {t.assignedTo.split("@")[0]}
                        </span>
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {t.dueDate}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(t.id, "completed");
                        }}
                        className="w-full mt-1 text-center text-xs bg-green-50 dark:bg-green-950/60 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Complete Task ✅
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed Column */}
              <div className="bg-green-50/20 dark:bg-green-950/10 border border-green-100/40 dark:border-green-900/20 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-green-100/60 dark:border-green-900/40">
                  <h3 className="font-bold text-green-700 dark:text-green-300">
                    Completed ✅
                  </h3>
                  <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full text-xs font-bold">
                    {completedTasks.length}
                  </span>
                </div>

                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setTaskModalOpen(true);
                    }}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 line-through mb-2">
                          {t.title}
                        </h4>
                        {t.rating && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-bold">{t.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-slate-400 text-xs line-clamp-2 mb-4">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {t.assignedTo.split("@")[0]}
                      </span>
                      {t.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {t.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Members Tab */
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-md transition-colors duration-300">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Workspace Members
            </h3>

            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.email}
                  className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {member.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Role: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{member.role}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    member.role === "owner"
                      ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                      : member.role === "internal"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-orange-100 dark:bg-amber-950/60 text-orange-700 dark:text-amber-300"
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Task Modal */}
        {createTaskOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 relative max-h-[90vh] flex flex-col overflow-hidden">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex-shrink-0">
                Assign Team Task
              </h2>

              <form onSubmit={handleCreateTask} className="space-y-6 flex-grow overflow-y-auto pr-2 scrollbar-thin text-left">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Task Title
                  </label>
                  <input
                    aria-label="Task title"
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    aria-label="Task description"
                    rows="3"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide details on the assignment"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                      Assignee
                    </label>
                    <select
                      aria-label="Assign task to"
                      required
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                    >
                      <option value="">Select Assignee</option>
                      {team.members.map((m) => (
                        <option key={m.email} value={m.email}>
                          {m.email} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                      Due Date
                    </label>
                    <input
                      aria-label="Task due date"
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* AI Workload Balancer Button */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Sparkles size={16} /> Workload Suggestion
                    </span>
                    <button
                      type="button"
                      onClick={handleGetAiRecommendation}
                      disabled={aiLoading}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg transition font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {aiLoading ? "Thinking..." : "AI Recommend"}
                    </button>
                  </div>

                  {aiRecommendation && (
                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-inner">
                      {aiRecommendation}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateTaskOpen(false);
                      setTaskTitle("");
                      setTaskDesc("");
                      setTaskAssignee("");
                      setTaskDueDate("");
                      setAiRecommendation("");
                    }}
                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask}
                    aria-busy={creatingTask}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingTask ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Task Detail / Interaction Modal */}
        {taskModalOpen && selectedTask &&
          createPortal(
            <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 relative max-h-[90vh] flex flex-col overflow-hidden">
              {/* Close Modal Button */}
              <button
                onClick={() => {
                  setTaskModalOpen(false);
                  setSelectedTask(null);
                  setFeedbackText("");
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer z-50"
              >
                ✕
              </button>

              <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin text-left">
                {/* Task Title */}
                <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {selectedTask.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Assigned to: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTask.assignedTo}</span>
                  </p>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Task Status
                  </label>
                  <select
                    aria-label="Task status"
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                    disabled={Boolean(statusUpdatingId)}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="pending">Pending ⏳</option>
                    <option value="in_progress">In Progress 🚀</option>
                    <option value="completed">Completed ✅</option>
                  </select>
                </div>
              </div>

              {/* Task Description */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-transparent dark:border-slate-800 mb-6">
                <h4 className="font-bold text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Task Details
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              {/* Rating & Feedback Section (Only for completed tasks) */}
              {selectedTask.status === "completed" && (
                <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 mb-6">
                  <h3 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                    <Award size={18} /> Team Feedback & Rating
                  </h3>

                  {selectedTask.rating ? (
                    /* Existing review */
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= selectedTask.rating ? "text-amber-500" : "text-gray-300"
                            }
                            fill={star <= selectedTask.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "{selectedTask.feedback || "No review feedback entered."}"
                      </p>
                    </div>
                  ) : isOwner ? (
                    /* Leader Review Form */
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                          Score contribution:
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingScore(star)}
                              className="text-amber-500 hover:scale-110 transition cursor-pointer"
                            >
                              <Star
                                size={22}
                                className={star <= ratingScore ? "text-amber-500" : "text-gray-300"}
                                fill={star <= ratingScore ? "currentColor" : "none"}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 items-end">
                        <input
                          aria-label="Write a comment"
                          type="text"
                          required
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Give feedback on this work..."
                          className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={savingReview}
                          aria-busy={savingReview}
                          className="bg-amber-600 hover:bg-amber-700 disabled:hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {savingReview ? "Saving..." : "Submit"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Waiting for Leader review */
                    <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                      Waiting for the team owner's feedback and rating.
                    </p>
                  )}
                </div>
              )}

              {/* Comments Feed */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-4">
                  <MessageSquare size={18} /> Discussion
                </h3>

                {/* Comment list */}
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1.5 scrollbar-thin mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent dark:border-slate-800">
                  {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400 italic text-center py-4">
                      No discussion logs yet. Ask a question or submit updates below.
                    </p>
                  ) : (
                    selectedTask.comments.map((c, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3.5 rounded-xl"
                      >
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 mb-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {c.sender}
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                          {c.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    aria-label="Rating out of 5"
                    type="text"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type comments, links or updates..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={postingComment}
                    aria-busy={postingComment}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white px-5 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {postingComment ? "Posting..." : "Post"}
                  </button>
                </form>
              </div>

              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Team Settings / Manage Modal */}
        {settingsModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 relative max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">
              
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  Manage Team Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 flex-grow overflow-y-auto pr-2 scrollbar-thin">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Team Name
                  </label>
                  <input
                    aria-label="Team name"
                    type="text"
                    required
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    aria-label="Team description"
                    rows="3"
                    value={editTeamDesc}
                    onChange={(e) => setEditTeamDesc(e.target.value)}
                    placeholder="What is this team working on?"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Edit Members section */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Manage Team Members
                  </h3>

                  <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end mb-4">
                    <div>
                      <label className="block mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Email Address
                      </label>
                      <input
                        aria-label="New member email address"
                        type="email"
                        value={newEditMemberEmail}
                        onChange={(e) => setNewEditMemberEmail(e.target.value)}
                        placeholder="collaborator@domain.com"
                        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Role
                      </label>
                      <select
                        aria-label="New member role"
                        value={newEditMemberRole}
                        onChange={(e) => setNewEditMemberRole(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMemberToEdit}
                      className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 p-3.5 rounded-xl border border-transparent dark:border-indigo-900 transition cursor-pointer"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {/* List of current members */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1.5 scrollbar-thin mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent dark:border-slate-800">
                    {editTeamMembers.map((member) => (
                      <div
                        key={member.email}
                        className="flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-2 rounded-xl"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {member.email}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                            {member.role}
                          </span>
                        </div>
                        {member.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromEdit(member.email)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-6 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
                  {/* Danger Zone: Delete Team */}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/60 px-5 py-3 rounded-xl font-semibold transition cursor-pointer text-sm"
                  >
                    <Trash2 size={16} />
                    Delete Team
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSettingsModalOpen(false)}
                      className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      aria-busy={savingSettings}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingSettings ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </MainLayout>
  );
}

export default TeamDetails;
