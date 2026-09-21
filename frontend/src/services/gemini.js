// These used to call Gemini directly from the browser using
// VITE_GEMINI_API_KEY. Vite inlines VITE_-prefixed variables into the built
// bundle, so that key shipped to every visitor. Generation now happens on the
// backend (backend/src/ai.js) and this module is a thin client over it — the
// exported function signatures are unchanged, so call sites did not move.

// In development Vite proxies /api to the local server, so the base is empty.
// In production the API lives on its own host (Vercel), so the deployed build
// is given its absolute URL. Trailing slashes are trimmed so the joined path
// never ends up with a double slash.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function callAI(endpoint, payload) {
  const response = await fetch(`${API_BASE}/api/ai/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "AI request failed.");
  }

  const { text } = await response.json();
  return text;
}

export const generateInternshipReport = async (tasks) =>
  callAI("internship-report", { tasks });

export const generateAISchedule = async (tasks) =>
  callAI("schedule", { tasks });

export const recommendTeamAssignee = async (
  taskTitle,
  taskDesc,
  members,
  activeTasksCount
) => {
  try {
    return await callAI("recommend-assignee", {
      taskTitle,
      taskDesc,
      members,
      activeTasksCount,
    });
  } catch (error) {
    console.error("AI recommendation error:", error);
    return "Could not generate AI recommendation at this time.";
  }
};

// Checklist titles are duplicated here only to build the offline fallback
// below; the authoritative prompt copy lives on the server.
const FALLBACK_CHECKLISTS = {
  Resume: [
    "Education Section",
    "Skills Summary",
    "Project Portfolios",
    "Work Experience",
    "Certifications",
  ],
  Assignment: [
    "Introduction Overview",
    "Core Objectives",
    "Conclusion Summary",
    "Bibliography / References",
  ],
  "Internship Report": [
    "Company Profile",
    "Log of Work Done",
    "Technologies & Toolings",
    "Learning Milestones",
    "Report Conclusion",
  ],
};

const DEFAULT_FALLBACK_CHECKLIST = [
  "Problem Statement",
  "Research Objectives",
  "Methodology Details",
  "Implementation Walkthrough",
  "Testing Metrics",
  "Future Scope Limitations",
];

export const analyzePDFDocument = async (docType, text) => {
  try {
    const raw = await callAI("analyze-pdf", { docType, text });
    const jsonStr = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini PDF analysis failed:", error);

    // Same degraded-but-useful result as before: a keyword-based structural
    // audit, so the page still works when AI is unavailable.
    const titles = FALLBACK_CHECKLISTS[docType] || DEFAULT_FALLBACK_CHECKLIST;

    return {
      checklist: titles.map((title) => ({
        title,
        found: text.toLowerCase().includes(title.split(" ")[0].toLowerCase()),
      })),
      summary: "Completed a structural audit of the uploaded PDF.",
      insights: [
        "Verified critical sections layout.",
        "Detected vocabulary density.",
        "Checked formatting margins compliance.",
      ],
      tips: [
        "Include more concrete metrics/data in your reports.",
        "Double-check citation styles and page numbering.",
        "Add an appendix or references section for academic credibility.",
      ],
    };
  }
};
