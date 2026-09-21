import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { awardXpOnce } from "./rewards";

/**
 * The 8 achievement badges. `target` is the raw stat value required to
 * unlock; progress is always computed live from real Firestore data in
 * computeAchievementProgress — never hardcoded or stored as the source
 * of truth (the persisted users/{uid}/achievements/{id} doc is a cache
 * of the last computed state, refreshed on every runAchievementChecks
 * call, so it stays correct after refresh/login without recomputation
 * needed just to render).
 */
export const ACHIEVEMENTS = [
  {
    id: "firstTask",
    title: "First Task Complete",
    description: "Complete your first task.",
    icon: "✅",
    target: 1,
    xpReward: 25,
  },
  {
    id: "streak7",
    title: "7 Day Streak",
    description: "Reach a 7-day completion streak.",
    icon: "🔥",
    target: 7,
    xpReward: 50,
  },
  {
    id: "streak30",
    title: "30 Day Streak",
    description: "Reach a 30-day completion streak.",
    icon: "🔥",
    target: 30,
    xpReward: 150,
  },
  {
    id: "assignmentMaster",
    title: "Assignment Master",
    description: "Complete 10 College assignments.",
    icon: "🎓",
    target: 10,
    xpReward: 100,
  },
  {
    id: "internshipHero",
    title: "Internship Hero",
    description: "Submit your first internship weekly report.",
    icon: "💼",
    target: 1,
    xpReward: 100,
  },
  {
    id: "teamLeader",
    title: "Team Leader",
    description: "Create a team and complete a team task.",
    icon: "👑",
    target: 1,
    xpReward: 100,
  },
  {
    id: "productivityChampion",
    title: "Productivity Champion",
    description: "Complete 50 tasks.",
    icon: "🏆",
    target: 50,
    xpReward: 200,
  },
  {
    id: "pdfExpert",
    title: "PDF Expert",
    description: "Upload and analyze 10 PDFs.",
    icon: "📄",
    target: 10,
    xpReward: 100,
  },
];

const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));

/**
 * Gathers the real, current stat values each achievement's progress is
 * measured against. No hardcoded or fake data — everything here comes
 * from the same Firestore collections the rest of the app already uses.
 */
export async function computeAchievementProgress(userId) {
  const [userSnap, tasksSnap, pdfSnap, reportsSnap, ownedTeamsSnap] = await Promise.all([
    getDoc(doc(db, "users", userId)),
    getDocs(query(collection(db, "tasks"), where("userId", "==", userId))),
    getDocs(query(collection(db, "pdfDocuments"), where("userId", "==", userId))),
    getDocs(query(collection(db, "internshipReports"), where("userId", "==", userId))),
    getDocs(query(collection(db, "teams"), where("createdBy", "==", userId))),
  ]);

  const userData = userSnap.exists() ? userSnap.data() : {};
  const streak = userData.streak || 0;

  let totalCompleted = 0;
  let collegeCompleted = 0;
  tasksSnap.forEach((docSnap) => {
    const t = docSnap.data();
    if (t.completed) {
      totalCompleted++;
      if (t.category === "College") collegeCompleted++;
    }
  });

  const pdfCount = pdfSnap.size;
  const internshipReportsCount = reportsSnap.size;

  // Team Leader: user owns at least one team AND at least one task in
  // an owned team has been marked "completed".
  let teamLeaderQualifies = false;
  const ownedTeamIds = [];
  ownedTeamsSnap.forEach((docSnap) => ownedTeamIds.push(docSnap.id));

  if (ownedTeamIds.length > 0) {
    // Firestore 'in' supports up to 30 values, which comfortably covers
    // this app's expected team-ownership scale.
    const teamTasksSnap = await getDocs(
      query(collection(db, "teamTasks"), where("teamId", "in", ownedTeamIds.slice(0, 30)))
    );
    teamTasksSnap.forEach((docSnap) => {
      if (docSnap.data().status === "completed") teamLeaderQualifies = true;
    });
  }

  return {
    firstTask: totalCompleted >= 1 ? 1 : 0,
    streak7: streak,
    streak30: streak,
    assignmentMaster: collegeCompleted,
    internshipHero: internshipReportsCount >= 1 ? 1 : 0,
    teamLeader: teamLeaderQualifies ? 1 : 0,
    productivityChampion: totalCompleted,
    pdfExpert: pdfCount,
  };
}

/**
 * Recomputes progress for all 8 achievements from real data, persists
 * it to users/{uid}/achievements/{id}, and awards XP (once, via
 * awardXpOnce) for any that just crossed their unlock threshold.
 *
 * Safe to call from anywhere, as often as needed — completing a task,
 * uploading a PDF, generating an internship report, completing a team
 * task all call this so achievements update automatically with no
 * manual "check achievements" step. Duplicate-unlock protection is
 * enforced by awardXpOnce's Firestore transaction, not by this
 * function's own read-then-write, so concurrent calls from different
 * pages can't double-award.
 *
 * `addNotification` is optional — pass the addNotification function
 * from useNotifications() when calling from a component so unlocks
 * also produce a toast + persistent notification-feed entry.
 */
export async function runAchievementChecks(userId, { addNotification } = {}) {
  if (!userId) return { newlyUnlocked: [] };

  let progressMap;
  try {
    progressMap = await computeAchievementProgress(userId);
  } catch (error) {
    console.error("Failed to compute achievement progress:", error);
    return { newlyUnlocked: [] };
  }

  const newlyUnlocked = [];

  for (const def of ACHIEVEMENTS) {
    const rawProgress = progressMap[def.id] ?? 0;
    const cappedProgress = Math.min(rawProgress, def.target);
    const achRef = doc(db, "users", userId, "achievements", def.id);

    let achSnap;
    try {
      achSnap = await getDoc(achRef);
    } catch (error) {
      console.error(`Failed to read achievement state for ${def.id}:`, error);
      continue;
    }

    const alreadyUnlocked = achSnap.exists() && achSnap.data().unlocked === true;
    const shouldUnlock = !alreadyUnlocked && rawProgress >= def.target;

    try {
      await setDoc(
        achRef,
        {
          achievementId: def.id,
          progress: cappedProgress,
          target: def.target,
          unlocked: alreadyUnlocked || shouldUnlock,
          ...(shouldUnlock ? { unlockedAt: serverTimestamp() } : {}),
        },
        { merge: true }
      );
    } catch (error) {
      console.error(`Failed to persist achievement progress for ${def.id}:`, error);
      continue;
    }

    if (shouldUnlock) {
      // awardXpOnce's transaction is the real source of truth for "did
      // THIS call actually win the unlock". Several components can call
      // runAchievementChecks concurrently on page load (Dashboard,
      // WelcomeCard, AchievementsPanel each independently mount
      // useAchievements), so `shouldUnlock` alone isn't reliable — only
      // fire the notification for whichever call actually got `awarded`,
      // otherwise the same unlock announces multiple times.
      let awarded = false;
      try {
        const result = await awardXpOnce(userId, {
          xp: def.xpReward,
          reason: `Achievement unlocked: ${def.title}`,
          uniqueRewardId: `achievement-${def.id}`,
        });
        awarded = result.awarded;
      } catch (error) {
        console.error(`Failed to award XP for achievement ${def.id}:`, error);
      }

      if (!awarded) continue;

      newlyUnlocked.push(def);

      if (addNotification) {
        try {
          await addNotification(
            "🎉 Achievement Unlocked!",
            `${def.icon} ${def.title} — ${def.description} (+${def.xpReward} XP)`,
            "achievement"
          );
        } catch (error) {
          console.error("Failed to send achievement notification:", error);
        }
      }
    }
  }

  return { newlyUnlocked };
}

/**
 * Fetches the persisted achievement state (progress/unlocked/unlockedAt)
 * merged with the static catalog (title/description/icon/target), for
 * rendering. Achievements not yet computed for this user default to
 * locked/0 progress rather than being omitted.
 */
export async function fetchAchievements(userId) {
  if (!userId) return ACHIEVEMENTS.map((def) => ({ ...def, progress: 0, unlocked: false, unlockedAt: null }));

  const snapshot = await getDocs(collection(db, "users", userId, "achievements"));
  const stateById = new Map();
  snapshot.forEach((docSnap) => {
    if (ACHIEVEMENT_IDS.has(docSnap.id)) {
      stateById.set(docSnap.id, docSnap.data());
    }
  });

  return ACHIEVEMENTS.map((def) => {
    const state = stateById.get(def.id);
    return {
      ...def,
      progress: state?.progress ?? 0,
      unlocked: state?.unlocked === true,
      unlockedAt: state?.unlockedAt ?? null,
    };
  });
}
