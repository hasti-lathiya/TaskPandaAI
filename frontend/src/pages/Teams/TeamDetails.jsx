import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
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

function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();

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

  // Filtering states
  const [taskSearch, setTaskSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");

  const loadTeamData = async (user) => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch Team details
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) {
        alert("Team not found!");
        navigate("/teams");
        return;
      }

      const teamData = teamSnap.data();
      // Access check
      const isMember =
        teamData.createdBy === user.uid ||
        teamData.memberEmails?.includes(user.email.toLowerCase());

      if (!isMember) {
        alert("You do not have access to this team.");
        navigate("/teams");
        return;
      }

      setTeam({ id: teamSnap.id, ...teamData });

      // Fetch Team Tasks
      const tasksQuery = query(
        collection(db, "teamTasks"),
        where("teamId", "==", teamId)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const tasksList = [];
      tasksSnap.forEach((doc) => {
        tasksList.push({ id: doc.id, ...doc.data() });
      });

      setTasks(tasksList);
    } catch (error) {
      console.error("Error loading team details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadTeamData(user);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Generate AI Recommendation
  const handleGetAiRecommendation = async () => {
    if (!taskTitle.trim()) {
      alert("Please enter a task title first.");
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
    if (!taskTitle.trim() || !taskAssignee) {
      alert("Title and Assignee are required!");
      return;
    }

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

      alert("🎉 Team Task Created!");
      setTaskTitle("");
      setTaskDesc("");
      setTaskAssignee("");
      setTaskDueDate("");
      setAiRecommendation("");
      setCreateTaskOpen(false);
      loadTeamData(auth.currentUser);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task.");
    }
  };

  // Add Comment to Task
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

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
    }
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, "teamTasks", taskId);
      await updateDoc(taskRef, { status: newStatus });

      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      // If status changed to completed, reward points automatically!
      if (newStatus === "completed") {
        const taskObj = tasks.find((t) => t.id === taskId);
        if (taskObj && taskObj.assignedTo) {
          rewardXPAndCoins(taskObj.assignedTo);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Reward XP and Coins to completed task owner
  const rewardXPAndCoins = async (assigneeEmail) => {
    try {
      // Find user UID by email in users collection
      const q = query(
        collection(db, "users"),
        where("email", "==", assigneeEmail.toLowerCase())
      );
      const userSnap = await getDocs(q);

      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        const userRef = doc(db, "users", userDoc.id);
        const currentData = userDoc.data();

        const newXp = (currentData.xp || 0) + 20;
        const newCoins = (currentData.coins || 0) + 10;
        const currentLevel = currentData.level || 1;

        // Level up logic (every 100 XP is a level)
        const expectedLevel = Math.floor(newXp / 100) + 1;
        const isLeveledUp = expectedLevel > currentLevel;

        await updateDoc(userRef, {
          xp: newXp,
          coins: newCoins,
          level: expectedLevel,
        });

        alert(
          `🏆 Work Completed! ${assigneeEmail} rewarded +20 XP and +10 Coins!${
            isLeveledUp ? " 🎉 LEVEL UP!" : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error rewarding points:", error);
    }
  };

  // Review and Rate completed task
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

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
      alert("⭐ Feedback and rating saved successfully!");
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting review:", error);
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
    if (editTeamMembers.some((m) => m.email === emailLower)) {
      alert("Member already in the list!");
      return;
    }
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
      alert("Cannot remove the team owner!");
      return;
    }
    setEditTeamMembers(editTeamMembers.filter((m) => m.email !== email));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editTeamName.trim()) {
      alert("Team Name is required!");
      return;
    }

    try {
      const teamRef = doc(db, "teams", teamId);
      const memberEmails = editTeamMembers.map((m) => m.email);

      await updateDoc(teamRef, {
        name: editTeamName.trim(),
        description: editTeamDesc.trim(),
        members: editTeamMembers,
        memberEmails: memberEmails,
      });

      alert("🎉 Team settings updated successfully!");
      setSettingsModalOpen(false);
      loadTeamData(auth.currentUser);
    } catch (err) {
      console.error("Error saving team settings:", err);
      alert("Failed to update team settings.");
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this team and all associated tasks? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // 1. Delete all tasks belonging to this team
      const tasksQuery = query(
        collection(db, "teamTasks"),
        where("teamId", "==", teamId)
      );
      const tasksSnap = await getDocs(tasksQuery);
      
      const deletePromises = [];
      tasksSnap.forEach((taskDoc) => {
        deletePromises.push(deleteDoc(doc(db, "teamTasks", taskDoc.id)));
      });
      await Promise.all(deletePromises);

      // 2. Delete team doc
      await deleteDoc(doc(db, "teams", teamId));

      alert("🗑️ Team and all tasks deleted successfully.");
      navigate("/teams");
    } catch (err) {
      console.error("Error deleting team:", err);
      alert("Failed to delete team.");
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
                  type="text"
                  placeholder="🔍 Search tasks by title or description..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="w-full md:w-64">
                <select
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
                        <span className="font-semibold text-indigo-650 dark:text-indigo-400">
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
                        <span className="font-semibold text-indigo-650 dark:text-indigo-400">
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
                        <h4 className="font-bold text-slate-850 dark:text-slate-200 line-through mb-2">
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
                  className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl"
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
        {createTaskOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                Assign Team Task
              </h2>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide details on the assignment"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                      Assignee
                    </label>
                    <select
                      required
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
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
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* AI Workload Balancer Button */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Sparkles size={16} /> Workload Suggestion
                    </span>
                    <button
                      type="button"
                      onClick={handleGetAiRecommendation}
                      disabled={aiLoading}
                      className="text-xs bg-indigo-650 hover:bg-indigo-750 text-white px-3.5 py-1.5 rounded-lg transition font-medium cursor-pointer"
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

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail / Interaction Modal */}
        {taskModalOpen && selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="pending">Pending ⏳</option>
                    <option value="in_progress">In Progress 🚀</option>
                    <option value="completed">Completed ✅</option>
                  </select>
                </div>
              </div>

              {/* Task Description */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-transparent dark:border-slate-800 mb-6">
                <h4 className="font-bold text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Task Details
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-350 whitespace-pre-line">
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
                      <p className="text-sm text-slate-700 dark:text-slate-350 italic">
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
                          type="text"
                          required
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Give feedback on this work..."
                          className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Submit
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
                <div className="space-y-3 max-h-40 overflow-y-auto mb-4 bg-slate-55 dark:bg-slate-850 p-3 rounded-2xl border border-transparent dark:border-slate-800">
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
                    type="text"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type comments, links or updates..."
                    className="flex-1 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-650 hover:bg-indigo-755 text-white px-5 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Post
                  </button>
                </form>
              </div>

              {/* Close Modal Button */}
              <button
                onClick={() => {
                  setTaskModalOpen(false);
                  setSelectedTask(null);
                  setFeedbackText("");
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Team Settings / Manage Modal */}
        {settingsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors duration-300">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  Manage Team Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-650 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Team Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={editTeamDesc}
                    onChange={(e) => setEditTeamDesc(e.target.value)}
                    placeholder="What is this team working on?"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                        type="email"
                        value={newEditMemberEmail}
                        onChange={(e) => setNewEditMemberEmail(e.target.value)}
                        placeholder="collaborator@domain.com"
                        className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Role
                      </label>
                      <select
                        value={newEditMemberRole}
                        onChange={(e) => setNewEditMemberRole(e.target.value)}
                        className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
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
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-transparent dark:border-slate-800">
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

                <div className="flex justify-between gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
                  {/* Danger Zone: Delete Team */}
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default TeamDetails;
