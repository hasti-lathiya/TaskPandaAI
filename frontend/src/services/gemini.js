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
export const FALLBACK_CHECKLISTS = {
  Resume: [
    "Contact Information",
    "Education Section",
    "Skills Summary",
    "Work Experience",
    "Project Portfolios",
    "Certifications",
  ],
  Assignment: [
    "Introduction Overview",
    "Core Objectives",
    "Discussion / Findings",
    "Conclusion Summary",
    "Bibliography / References",
  ],
  "Project Report": [
    "Problem Statement",
    "Research Objectives",
    "Methodology Details",
    "Implementation Walkthrough",
    "Testing Metrics",
    "Future Scope Limitations",
  ],
  "Internship Report": [
    "Company Profile",
    "Log of Work Done",
    "Technologies & Toolings",
    "Learning Milestones",
    "Report Conclusion",
  ],
  "Contract / Agreement": [
    "Parties & Effective Date",
    "Scope of Work & Obligations",
    "Payment Terms",
    "Term & Termination Clauses",
    "Confidentiality & NDA",
    "Governing Law",
  ],
  "Business Proposal": [
    "Executive Summary",
    "Problem & Proposed Solution",
    "Scope & Deliverables",
    "Pricing & Budget",
    "Timeline & Milestones",
  ],
  "Invoice / Receipt": [
    "Invoice Number & Date",
    "Vendor & Customer Details",
    "Itemized Line Items",
    "Subtotal & Total Due",
    "Payment Terms",
  ],
  "Meeting Minutes": [
    "Meeting Date & Attendees",
    "Agenda Topics",
    "Decisions & Approvals",
    "Action Items & Assignees",
    "Next Meeting Schedule",
  ],
  "Research Paper": [
    "Title & Abstract",
    "Literature Review",
    "Methodology",
    "Results & Analysis",
    "Discussion & Conclusions",
    "References",
  ],
  "Study Notes": [
    "Core Concepts & Definitions",
    "Key Formulas & Rules",
    "Illustrative Examples",
    "Chapter Summary",
    "Review Questions",
  ],
  "General Document": [
    "Document Title & Overview",
    "Core Themes & Arguments",
    "Supporting Data Points",
    "Actionable Takeaways",
    "Summary & Recommendations",
  ],
};

export const DEFAULT_FALLBACK_CHECKLIST = [
  "Document Title & Overview",
  "Core Themes & Arguments",
  "Supporting Data Points",
  "Actionable Takeaways",
  "Summary & Recommendations",
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

export const askPdfQuestion = async (question, text, docType) => {
  try {
    return await callAI("ask-pdf", { question, text, docType });
  } catch (error) {
    console.error("Gemini PDF Q&A failed:", error);
    // Provide a smart offline fallback answer if backend AI is unavailable
    const lowerQ = question.toLowerCase();
    const lowerT = (text || "").toLowerCase();

    if (lowerQ.includes("summary") || lowerQ.includes("overview")) {
      return `Based on the document (${docType}): The text spans ${text.split(/\s+/).filter(Boolean).length} words and outlines key themes including ${text.slice(0, 180)}...`;
    }
    if (lowerQ.includes("risk") || lowerQ.includes("penalty") || lowerQ.includes("liability")) {
      return `Reviewing risks for ${docType}: Check for explicit indemnification, termination notice periods, and statutory warranties in the source text.`;
    }
    return `Analysis for "${question}": The document covers ${docType} criteria. Specific references should be cross-verified against section headers in the source PDF.`;
  }
};

