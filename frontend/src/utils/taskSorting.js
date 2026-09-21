// Pure task filtering/sorting helpers, kept out of the component so they can be
// reasoned about — and tested — without rendering anything.
const PRIORITY_RANK = { High: 1, Medium: 2, Low: 3 };

// A task may carry a Firestore Timestamp, an ISO string, or nothing at all.
// Nanoseconds are included because whole seconds alone tie for tasks created in
// the same second, leaving "Newest First" to order them arbitrarily.
const getCreatedSeconds = (task) => {
  const created = task.createdAt;
  if (!created) return 0;

  if (typeof created.seconds === "number") {
    return created.seconds + (created.nanoseconds || 0) / 1e9;
  }

  const parsed = new Date(created).getTime();
  return Number.isNaN(parsed) ? 0 : parsed / 1000;
};

// Undated tasks sort last rather than becoming NaN and scattering the list.
const getDueTime = (task) => {
  const time = task.dueDate ? new Date(task.dueDate).getTime() : NaN;
  return Number.isNaN(time) ? Infinity : time;
};

// An unrecognised priority sorts last instead of poisoning the comparison.
const getPriorityRank = (task, sortBy) => {
  const rank = PRIORITY_RANK[task.priority];
  if (rank === undefined) return Number.MAX_SAFE_INTEGER;
  return sortBy === "lowPriority" ? 4 - rank : rank;
};

// Shared by the pending and completed lists. Keeping one implementation is
// what stops the two from drifting apart as sort options are added.
export const sortTasks = (list, sortBy) =>
  [...list].sort((a, b) => {
    if (sortBy === "dueDate") {
      return getDueTime(a) - getDueTime(b);
    }

    if (sortBy === "highPriority" || sortBy === "lowPriority") {
      const diff = getPriorityRank(a, sortBy) - getPriorityRank(b, sortBy);
      if (diff !== 0) return diff;
      return getCreatedSeconds(b) - getCreatedSeconds(a);
    }

    // "created" and any unknown value: newest first.
    return getCreatedSeconds(b) - getCreatedSeconds(a);
  });

export const filterTasks = (list, search, category) => {
  const term = search.trim().toLowerCase();

  return list.filter((task) => {
    const matchesSearch = (task.title || "").toLowerCase().includes(term);
    const matchesCategory = category === "All" || task.category === category;
    return matchesSearch && matchesCategory;
  });
};

