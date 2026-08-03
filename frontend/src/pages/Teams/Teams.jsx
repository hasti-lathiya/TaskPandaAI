import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
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

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("internal");

  // Fetch teams for the current user
  const loadTeams = async (user) => {
    if (!user) return;
    try {
      setLoading(true);
      // Query teams created by user
      const qCreated = query(
        collection(db, "teams"),
        where("createdBy", "==", user.uid)
      );

      // Query teams where user is a member
      const qMember = query(
        collection(db, "teams"),
        where("memberEmails", "array-contains", user.email.toLowerCase())
      );

      const [createdSnap, memberSnap] = await Promise.all([
        getDocs(qCreated),
        getDocs(qMember),
      ]);

      const teamsMap = new Map();

      createdSnap.forEach((doc) => {
        teamsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      memberSnap.forEach((doc) => {
        teamsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      setTeams(Array.from(teamsMap.values()));
    } catch (error) {
      console.error("Error loading teams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadTeams(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;
    const emailLower = newMemberEmail.trim().toLowerCase();
    if (members.some((m) => m.email === emailLower)) {
      alert("Member already added to the list!");
      return;
    }
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
    if (!teamName.trim()) {
      alert("Please enter a team name.");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

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

      alert("🎉 Team Created Successfully!");
      setTeamName("");
      setTeamDesc("");
      setMembers([]);
      setCreateModalOpen(false);
      loadTeams(currentUser);
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team.");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-650 dark:text-indigo-400" size={32} />
              Team Collaboration
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              Create teams, assign tasks, and collaborate with internal and external members.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            <Plus size={18} />
            Create Team
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-[32px] p-8 shadow-sm">
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
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-sm text-center">
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
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-indigo-600/10">
                        1
                      </div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Create Team</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Click the "Create Team" button to initialize a team name and focus.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-purple-600/10">
                        2
                      </div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Add Members</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Input collaborator emails to assign internal or external viewer/leader roles.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-md shadow-pink-600/10">
                        3
                      </div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Collaborate!</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Run Jitsi meets, balancer workloads, post discussion replies, and grow.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:shadow-indigo-500/20 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    Create Your First Team
                  </button>
                </div>
              ) : (
                /* Workspaces Grid list */
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200 border-b border-gray-150 dark:border-slate-800/80 pb-2">
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
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-650 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-500/10 select-none">
                               {team.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <h4 className="font-bold text-slate-800 dark:text-slate-105 leading-snug tracking-tight">
                                 {formatTeamName(team.name)}
                               </h4>
                               <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-widest mt-0.5 block">
                                 Owner
                               </span>
                             </div>
                           </div>
                           <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                             {team.description || "No description provided."}
                           </p>
                         </div>

                         <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/60 pt-4 mt-auto">
                           <span className="text-xs text-slate-550 dark:text-slate-400 flex items-center gap-1 font-bold">
                             <Users size={14} />
                             {team.members?.length || 0} members
                           </span>
                           <Link
                             to={`/teams/${team.id}`}
                             className="text-indigo-650 dark:text-indigo-400 hover:underline font-bold text-xs flex items-center gap-1"
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
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2 mb-4">
                  <MailOpen size={18} className="text-indigo-650 dark:text-indigo-400" />
                  My Team Invites
                </h3>

                {myJoinedInvites.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-4">
                    <MailOpen className="w-8 h-8 text-slate-350 dark:text-slate-600 mb-2 opacity-50 select-none" />
                    <p className="text-xs text-[#9CA3AF] dark:text-slate-400 font-bold italic">
                      No external team invites found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {myJoinedInvites.map((team) => (
                      <div
                        key={team.id}
                        className="bg-slate-50/50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                          {formatTeamName(team.name)}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {team.description || "No description provided."}
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/40">
                          <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wider">
                            Collaborator
                          </span>
                          <Link
                            to={`/teams/${team.id}`}
                            className="text-xs text-indigo-650 dark:text-indigo-400 font-bold hover:underline"
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
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-indigo-650 dark:text-indigo-400" />
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
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors duration-300">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                Create New Team
              </h2>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Team Name
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    placeholder="What is this team working on?"
                    className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Add Members section */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Invite Team Members
                  </h3>

                  <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end mb-4">
                    <div>
                      <label className="block mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="collaborator@domain.com"
                        className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Role
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer text-slate-800 dark:text-slate-100"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 p-3.5 rounded-xl border border-transparent dark:border-indigo-900 transition cursor-pointer"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>

                  {/* List of members being added */}
                  {members.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-4 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-transparent dark:border-slate-800">
                      {members.map((member) => (
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
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.email)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      setTeamName("");
                      setTeamDesc("");
                      setMembers([]);
                    }}
                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default Teams;
