import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const testEnv = await initializeTestEnvironment({
  projectId: "demo-taskpanda",
  firestore: {
    rules: readFileSync("firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8080,
  },
});

const ALICE = { uid: "alice", email: "alice@example.com" };
const BOB = { uid: "bob", email: "bob@example.com" };
const MALLORY = { uid: "mallory", email: "mallory@example.com" };

const as = (u) => testEnv.authenticatedContext(u.uid, { email: u.email }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

// Seed data bypassing rules
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "users/alice"), { fullName: "Alice", email: ALICE.email, xp: 100, coins: 50 });
  await setDoc(doc(db, "users/bob"), { fullName: "Bob", email: BOB.email, xp: 10, coins: 5 });
  await setDoc(doc(db, "tasks/alice-task"), { userId: "alice", title: "Alice task", completed: false });
  await setDoc(doc(db, "teams/team1"), {
    name: "Team One",
    createdBy: "alice",
    memberEmails: ["alice@example.com", "bob@example.com"],
    members: [{ email: ALICE.email, role: "owner" }, { email: BOB.email, role: "internal" }],
  });
  await setDoc(doc(db, "teamTasks/tt1"), {
    teamId: "team1", title: "Build login", assignedTo: BOB.email, status: "pending", comments: [],
  });
  await setDoc(doc(db, "notifications/n1"), { userId: "alice", title: "hi" });
  await setDoc(doc(db, "secretStuff/x"), { anything: true });
});

let pass = 0, fail = 0;
async function check(name, promise) {
  try { await promise; console.log(`PASS  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n        ${e.message.split("\n")[0]}`); fail++; }
}

console.log("\n--- authentication ---");
await check("anonymous cannot read a user profile",
  assertFails(getDoc(doc(anon(), "users/alice"))));
await check("anonymous cannot read tasks",
  assertFails(getDoc(doc(anon(), "tasks/alice-task"))));

console.log("\n--- users: the core lockdown ---");
await check("alice reads her own profile",
  assertSucceeds(getDoc(doc(as(ALICE), "users/alice"))));
await check("bob CAN read alice's profile (needed for email->uid lookup)",
  assertSucceeds(getDoc(doc(as(BOB), "users/alice"))));
await check("alice updates her own profile",
  assertSucceeds(updateDoc(doc(as(ALICE), "users/alice"), { bio: "hello" })));
await check("MALLORY CANNOT grant herself coins on alice's doc",
  assertFails(updateDoc(doc(as(MALLORY), "users/alice"), { coins: 999999 })));
await check("BOB (a teammate) CANNOT award XP to alice",
  assertFails(updateDoc(doc(as(BOB), "users/alice"), { xp: 5000 })));
await check("nobody can delete a user doc",
  assertFails(deleteDoc(doc(as(ALICE), "users/alice"))));
await check("bob cannot write alice's rewardClaims",
  assertFails(setDoc(doc(as(BOB), "users/alice/rewardClaims/team-task-tt1"), { xp: 20 })));
await check("alice can write her own rewardClaims",
  assertSucceeds(setDoc(doc(as(ALICE), "users/alice/rewardClaims/r1"), { xp: 20 })));

console.log("\n--- personal tasks ---");
await check("alice reads her own task",
  assertSucceeds(getDoc(doc(as(ALICE), "tasks/alice-task"))));
await check("bob cannot read alice's task",
  assertFails(getDoc(doc(as(BOB), "tasks/alice-task"))));
await check("alice creates a task stamped with her uid",
  assertSucceeds(setDoc(doc(as(ALICE), "tasks/new1"), { userId: "alice", title: "x" })));
await check("alice cannot create a task owned by bob",
  assertFails(setDoc(doc(as(ALICE), "tasks/new2"), { userId: "bob", title: "x" })));
await check("alice cannot reassign her task to bob",
  assertFails(updateDoc(doc(as(ALICE), "tasks/alice-task"), { userId: "bob" })));
await check("alice's own query is allowed",
  assertSucceeds(getDocs(query(collection(as(ALICE), "tasks"), where("userId", "==", "alice")))));
await check("bob cannot query alice's tasks",
  assertFails(getDocs(query(collection(as(BOB), "tasks"), where("userId", "==", "alice")))));

console.log("\n--- teams ---");
await check("owner reads the team",
  assertSucceeds(getDoc(doc(as(ALICE), "teams/team1"))));
await check("member reads the team",
  assertSucceeds(getDoc(doc(as(BOB), "teams/team1"))));
await check("outsider cannot read the team",
  assertFails(getDoc(doc(as(MALLORY), "teams/team1"))));
await check("owner updates team settings",
  assertSucceeds(updateDoc(doc(as(ALICE), "teams/team1"), { name: "Renamed" })));
await check("member CANNOT update team settings",
  assertFails(updateDoc(doc(as(BOB), "teams/team1"), { name: "Hijacked" })));
await check("member cannot add themselves to another team",
  assertFails(setDoc(doc(as(MALLORY), "teams/team2"), { createdBy: "alice", memberEmails: [] })));
await check("member CANNOT delete the team",
  assertFails(deleteDoc(doc(as(BOB), "teams/team1"))));

console.log("\n--- team tasks: owner + assignee ---");
await check("member reads a team task",
  assertSucceeds(getDoc(doc(as(BOB), "teamTasks/tt1"))));
await check("outsider cannot read a team task",
  assertFails(getDoc(doc(as(MALLORY), "teamTasks/tt1"))));
await check("owner creates a team task",
  assertSucceeds(setDoc(doc(as(ALICE), "teamTasks/tt2"), { teamId: "team1", title: "New", assignedTo: BOB.email, status: "pending", comments: [] })));
await check("member CANNOT create a team task",
  assertFails(setDoc(doc(as(BOB), "teamTasks/tt3"), { teamId: "team1", title: "Nope", assignedTo: BOB.email, status: "pending" })));
await check("assignee updates status of their own task",
  assertSucceeds(updateDoc(doc(as(BOB), "teamTasks/tt1"), { status: "completed" })));
await check("owner updates any task",
  assertSucceeds(updateDoc(doc(as(ALICE), "teamTasks/tt1"), { status: "in_progress" })));
await check("member may add a comment",
  assertSucceeds(updateDoc(doc(as(BOB), "teamTasks/tt2"), { comments: [{ text: "hi" }] })));
await check("owner deletes a team task",
  assertSucceeds(deleteDoc(doc(as(ALICE), "teamTasks/tt2"))));
await check("member CANNOT delete a team task",
  assertFails(deleteDoc(doc(as(BOB), "teamTasks/tt1"))));
await check("outsider cannot comment",
  assertFails(updateDoc(doc(as(MALLORY), "teamTasks/tt1"), { comments: [{ text: "x" }] })));

console.log("\n--- per-user records ---");
await check("alice reads her notification",
  assertSucceeds(getDoc(doc(as(ALICE), "notifications/n1"))));
await check("bob cannot read alice's notification",
  assertFails(getDoc(doc(as(BOB), "notifications/n1"))));
await check("alice creates her own schedule",
  assertSucceeds(setDoc(doc(as(ALICE), "aiSchedules/s1"), { userId: "alice", content: "x" })));
await check("alice cannot create a schedule for bob",
  assertFails(setDoc(doc(as(ALICE), "aiSchedules/s2"), { userId: "bob", content: "x" })));

console.log("\n--- default deny ---");
await check("an undeclared collection is locked",
  assertFails(getDoc(doc(as(ALICE), "secretStuff/x"))));
await check("an undeclared collection cannot be written",
  assertFails(setDoc(doc(as(ALICE), "secretStuff/y"), { a: 1 })));

await testEnv.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
