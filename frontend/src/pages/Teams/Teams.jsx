import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  Users,
  PlusCircle,
  Trash,
  ArrowRight,
  TrendingUp,
  MailOpen,
} from "lucide-react";
import { db, auth } from "../../firebase/firebase";
import MainLayout from "../../layouts/MainLayout";
import CustomSelect from "../../components/Common/CustomSelect";
import { isValidEmail } from "../../utils/validation";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("internal");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Live subscriptions for the current user's teams. A one-shot read meant a
  // teammate adding you didn't show up until a manual reload.
  useEffect(() => {
    let unsubCreated = null;
    let unsubMember = null;

    // Two queries feed one list, so each keeps its own results and they are
    // merged on every update — otherwise one snapshot would clobber the other.
    let createdTeams = [];
    let memberTeams = [];

    const publish = () => {
      const teamsMap = new Map();
      [...createdTeams, ...memberTeams].forEach((team) => teamsMap.set(team.id, team));
      setTeams(Array.from(teamsMap.values()));
      setLoading(false);
    };

    const toTeams = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const onError = (err) => {
      console.error("Error loading teams:", err);
      setLoading(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubCreated) unsubCreated();
      if (unsubMember) unsubMember();
      createdTeams = [];
      memberTeams = [];

      if (!user) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      unsubCreated = onSnapshot(
        query(collection(db, "teams"), where("createdBy", "==", user.uid)),
        (snap) => {
          createdTeams = toTeams(snap);
          publish();
        },
        onError
      );

      unsubMember = onSnapshot(
        query(
          collection(db, "teams"),
          where("memberEmails", "array-contains", (user.email || "").toLowerCase())
        ),
        (snap) => {
          memberTeams = toTeams(snap);
          publish();
        },
        onError
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubCreated) unsubCreated();
      if (unsubMember) unsubMember();
    };
  }, []);

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;

    const emailLower = newMemberEmail.trim().toLowerCase();

    // The input is type="email", but this runs from a button click rather than
    // a form submit, so native validation never fires — check it here.
    if (!isValidEmail(emailLower)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    // The owner is added automatically on create; adding yourself again would
    // duplicate you in both members and memberEmails.
    if (emailLower === auth.currentUser?.email?.toLowerCase()) {
      setFormError("You're already the owner of this team.");
      return;
    }

    if (members.some((m) => m.email === emailLower)) {
      setFormError("That member is already on the list.");
      return;
    }

    setFormError("");
    setMembers([
      ...members,
      {
        email: emailLower,
        role: newMemberRole,
      },
    ]);
    setNewMemberEmail("");
  };

  const handleRemoveMember = (email) => {
    setMembers(members.filter((m) => m.email !== email));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (creating) return;

    if (!teamName.trim()) {
      setFormError("Please enter a team name.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      setFormError("Your session has expired. Please log in again.");
      return;
    }

    setFormError("");
    setCreating(true);

    try {

      const memberList = [
        {
          email: currentUser.email.toLowerCase(),
          role: "owner",
          uid: currentUser.uid,
        },
        ...members.map((m) => ({
          email: m.email,
          role: m.role,
          uid: null,
        })),
      ];

      const memberEmails = memberList.map((m) => m.email);

      await addDoc(collection(db, "teams"), {
        name: teamName.trim(),
        description: teamDesc.trim(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: memberList,
        memberEmails: memberEmails,
      });

      setTeamName("");
      setTeamDesc("");
      setMembers([]);
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
      setFormError("Could not create the team. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatTeamName = (name) => {
    if (!name) return "";
    return name
      .split(",")
      .map(part => part.trim().charAt(0).toUpperCase() + part.trim().slice(1))
      .join(", ");
  };

  const myCreatedTeams = teams.filter((t) => t.createdBy === auth.currentUser?.uid);
  const myJoinedInvites = teams.filter((t) => t.createdBy !== auth.currentUser?.uid);

  // Platform statistics calculation
  const totalWorkspaces = teams.length;
  const avgTeamSize =
    teams.length > 0
      ? Math.round(teams.reduce((acc, t) => acc + (t.members?.length || 0), 0) / teams.length)
      : 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-2 sm:py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-600 dark:text-indigo-400 w-7 h-7 sm:w-8 sm:h-8" />
              Team Collaboration
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-base">
              Create teams, assign tasks, and collaborate with internal and external members.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3 sm:py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            <Plus size={18} />
            Create Team
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
            <div className="text-4xl animate-bounce">🐼</div>
            <p className="text-gray-500 dark:text-slate-400 ml-3 text-lg font-semibold">
              Loading workspaces...
            </p>
          </div>
        ) : (
          /* Main Layout Split Grid (12-Columns) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (8/12 width) - Primary Workspaces */}
            <div className="lg:col-span-8 space-y-8">
              {myCreatedTeams.length === 0 && myJoinedInvites.length === 0 ? (
                /* Premium Redesigned Empty State Experience */
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
                    👥
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-50 mb-3 tracking-tight">
                    No Teams Found
                  </h2>
                  <p className="text-gray-500 dark:text-slate-400 mb-10 max-w-md mx-auto text-sm leading-relaxed">
                    You haven't created or joined any collaborator workspaces yet. Follow the steps below to start collaborating!
                  </p>

                  {/* Horizontal steps flow */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-gray-100 dark:border-slate-800/80 pt-10">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-indigo-600/10">
                        1
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Create Team</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Click the "Create Team" button to initialize a team name and focus.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-purple-600/10">
                        2
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Add Members</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Input collaborator emails to assign internal or external viewer/leader roles.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-pink-600/10">
                        3
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Collaborate!</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Run Jitsi meets, balancer workloads, post discussion replies, and grow.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:shadow-indigo-500/20 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    Create Your First Team
                  </button>
                </div>
              ) : (
                /* Workspaces Grid list */
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                    My Workspaces ({myCreatedTeams.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myCreatedTeams.map((team) => (
                       <div
                         key={team.id}
                         className="glass-premium rounded-[24px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-stretch h-full"
                       >
                         <div className="flex-grow">
                           <div className="flex items-center gap-3.5 mb-4">
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-500/10 select-none">
                               {team.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-snug tracking-tight">
                                 {formatTeamName(team.name)}
                               </h4>
                               <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest mt-0.5 block">
                                 Owner
                               </span>
                             </div>
                           </div>
                           <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                             {team.description || "No description provided."}
                           </p>
                         </div>

                         <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/60 pt-4 mt-auto">
                           <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                             <Users size={14} />
                             {team.members?.length || 0} members
                           </span>
                           <Link
                             to={`/teams/${team.id}`}
                             className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-xs flex items-center gap-1"
                           >
                             Enter Workspace <ArrowRight size={12} />
                           </Link>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4/12 width) - Side widgets */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Workspace Invites Panel */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <MailOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
                  My Team Invites
                </h3>

                {myJoinedInvites.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-4">
                    <MailOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 opacity-50 select-none" />
                    <p className="text-xs text-[#9CA3AF] dark:text-slate-400 font-bold italic">
                      No external team invites found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {myJoinedInvites.map((team) => (
                      <div
                        key={team.id}
                        className="bg-slate-50/50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                          {formatTeamName(team.name)}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {team.description || "No description provided."}
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/40">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                            Collaborator
                          </span>
                          <Link
                            to={`/teams/${team.id}`}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            Join Workspace →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform Statistics widget */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Workspace Stats
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-slate-800/50">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Total Workspaces</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{totalWorkspaces}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-slate-800/50">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Created by Me</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{myCreatedTeams.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-slate-800/50">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Average Team Size</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{avgTeamSize} members</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Create Team Modal */}
        {createModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-lg rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 relative max-h-[92vh] flex flex-col overflow-hidden transition-colors duration-300">
                <div className="flex justify-between items-center mb-6 sm:mb-8 flex-shrink-0">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                      👥 Create New Team
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">
                      Create a workspace and collaborate with your team.
                    </p>
                  </div>
                  <div className="text-3xl sm:text-5xl">
                    🐼
                  </div>
                </div>

              {formError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl mb-4 font-bold text-sm text-center flex-shrink-0"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-5 sm:space-y-6 flex-grow overflow-y-auto px-1.5 pr-2 sm:pr-2.5 py-1 scrollbar-thin">
                <div>
                  <label className="block mb-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="team-name">
                    Team Name
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="team-desc">
                    Description
                  </label>
                  <textarea
                    id="team-desc"
                    rows="3"
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    placeholder="What is this team working on?"
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm sm:text-base"
                  />
                </div>

                {/* Add Members section */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-5 sm:pt-6">
                  <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-3 sm:mb-4">
                    Invite Team Members
                  </h3>

                  <div className="flex flex-col sm:grid sm:grid-cols-[1fr_130px_auto] gap-3 items-stretch sm:items-end mb-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400" htmlFor="member-email">
                        Email Address
                      </label>
                      <input
                        id="member-email"
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="collaborator@domain.com"
                        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400" htmlFor="member-role">
                        Role
                      </label>
                      <CustomSelect
                        id="member-role"
                        ariaLabel="Member Role"
                        value={newMemberRole}
                        onChange={(val) => setNewMemberRole(val)}
                        options={[
                          { value: "internal", label: "Internal" },
                          { value: "external", label: "External" },
                        ]}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      aria-label="Add team member"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 sm:p-3.5 rounded-xl border border-transparent dark:border-indigo-900 transition cursor-pointer font-semibold text-sm"
                    >
                      <PlusCircle size={20} />
                      <span className="sm:hidden">Add Member</span>
                    </button>
                  </div>

                  {/* List of members being added */}
                  {members.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1.5 scrollbar-thin mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent dark:border-slate-800">
                      {members.map((member) => (
                        <div
                          key={member.email}
                          className="flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-3.5 py-2 rounded-xl"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {member.email}
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                              {member.role}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.email)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors duration-200 flex-shrink-0"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      setTeamName("");
                      setTeamDesc("");
                      setMembers([]);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    aria-busy={creating}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
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

export default Teams;
