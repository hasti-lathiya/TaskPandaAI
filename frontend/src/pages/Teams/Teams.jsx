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
import { Plus, Users, PlusCircle, Trash } from "lucide-react";
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
        where("memberEmails", "array-contains", user.email)
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
    if (members.some((m) => m.email === newMemberEmail.trim().toLowerCase())) {
      alert("Member already added to the list!");
      return;
    }
    setMembers([
      ...members,
      {
        email: newMemberEmail.trim().toLowerCase(),
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
          uid: null, // Will match when loaded/queried
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-300 rounded-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <Users className="text-indigo-600 dark:text-indigo-400" size={36} />
              Team Collaboration
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Create teams, assign tasks, and collaborate with internal and external members.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition cursor-pointer"
          >
            <Plus size={20} />
            Create Team
          </button>
        </div>

        {/* Loading / Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-4xl animate-bounce">🐼</div>
            <p className="text-gray-500 dark:text-slate-400 ml-3 text-lg font-medium">
              Loading your workspaces...
            </p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-md max-w-2xl mx-auto mt-10">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              No Teams Found
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              You aren't in any teams yet. Create a team and invite your friends, classmates, or external mentors to collaborate.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        ) : (
          /* Teams Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {team.name}
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                        {team.createdBy === auth.currentUser?.uid ? "Owner" : "Member"}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-slate-400 text-sm line-clamp-3 mb-6">
                    {team.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-4">
                  <span className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Users size={16} />
                    {team.members?.length || 0} members
                  </span>

                  <Link
                    to={`/teams/${team.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm transition"
                  >
                    Enter Workspace →
                  </Link>
                </div>
              </div>
            ))}
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
                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition cursor-pointer"
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
