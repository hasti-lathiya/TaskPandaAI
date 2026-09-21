import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// The key is read from the server environment and never sent to the browser.
// Previously this lived in the frontend as VITE_GEMINI_API_KEY, which Vite
// inlines into the built bundle — meaning every visitor could read it.
const API_KEY = process.env.GEMINI_API_KEY;

let model = null;
if (API_KEY) {
  model = new GoogleGenerativeAI(API_KEY).getGenerativeModel({
    model: "gemini-2.5-flash",
  });
} else {
  console.warn(
    "[ai] GEMINI_API_KEY is not set — /api/ai/* will return 503. " +
      "Add it to backend/.env (see backend/.env.example)."
  );
}

const router = express.Router();

// Every handler shares the same shape: validate input, build the prompt,
// call Gemini, return text. Errors never leak provider internals to the client.
function aiRoute(handler) {
  return async (req, res) => {
    if (!model) {
      return res
        .status(503)
        .json({ error: "AI is not configured on the server." });
    }

    try {
      const prompt = handler(req.body || {});
      if (typeof prompt !== "string") {
        return res.status(400).json({ error: prompt.error });
      }

      const result = await model.generateContent(prompt);
      return res.json({ text: result.response.text() });
    } catch (err) {
      console.error("[ai] generation failed:", err);
      return res.status(502).json({ error: "AI request failed." });
    }
  };
}

router.post(
  "/internship-report",
  aiRoute(({ tasks }) => {
    if (!tasks || !String(tasks).trim()) {
      return { error: "tasks is required." };
    }

    return `
Convert the following internship tasks into a professional weekly internship report suitable for college submission.

Tasks:
${tasks}

Generate:
- Professional language
- Paragraph format
- Internship report style
- Mention technical contribution
`;
  })
);

router.post(
  "/schedule",
  aiRoute(({ tasks }) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return { error: "tasks must be a non-empty array." };
    }

    const formattedTasks = tasks
      .map(
        (task, index) => `
${index + 1}. ${task.title}
Priority: ${task.priority}
Category: ${task.category}
Duration: ${task.estimatedDuration || 30} minutes
Energy: ${task.energyLevel || "Medium"}
Due Date: ${task.dueDate || "Not specified"}
`
      )
      .join("\n");

    return `
You are an AI productivity planner.

Generate the schedule in EXACTLY this format:

Morning
07:30 AM - 09:00 AM | Study | React Assignment | Urgent
09:15 AM - 11:15 AM | Internship | Gemini Module | Internship
11:15 AM - 11:30 AM | Break | Short Break | Break

Afternoon
12:00 PM - 01:00 PM | Personal | Lunch | Personal
01:00 PM - 02:00 PM | Study | Cloud Revision | Study

Evening
06:00 PM - 06:20 PM | Exercise | Exercise | Exercise

Rules:
- First line must be Morning, Afternoon or Evening section name.
- Use exactly this format:
TIME | CATEGORY | TASK | BADGE
- No markdown
- No bullet points
- No explanations
- No extra text

Tasks:
${formattedTasks}
`;
  })
);

router.post(
  "/recommend-assignee",
  aiRoute(({ taskTitle, taskDesc, members, activeTasksCount }) => {
    if (!taskTitle || !Array.isArray(members) || members.length === 0) {
      return { error: "taskTitle and a non-empty members array are required." };
    }

    const counts = activeTasksCount || {};
    const memberDetails = members
      .map(
        (member) => `
- Email: ${member.email}
  Role: ${member.role}
  Active Tasks Count: ${counts[member.email] || 0}
`
      )
      .join("\n");

    return `
You are an AI workload balancer and assistant.
Recommend the most suitable team member to assign the following task to.

Task Title: ${taskTitle}
Task Description: ${taskDesc || ""}

Team Members:
${memberDetails}

Guidelines:
- Analyze active tasks count (prefer members with fewer active tasks to balance workload).
- Align task title/description with the role (Internal vs External).
- Return your recommendation in a clean, short, professional paragraph (max 3 sentences). Mention the recommended member's email, why they were chosen, and why it balances the workload.
`;
  })
);

const PDF_CHECKLISTS = {
  Resume:
    "- Education Section\n- Skills Summary\n- Project Portfolios\n- Work Experience\n- Certifications",
  Assignment:
    "- Introduction Overview\n- Core Objectives\n- Conclusion Summary\n- Bibliography / References",
  "Internship Report":
    "- Company Profile\n- Log of Work Done\n- Technologies & Toolings\n- Learning Milestones\n- Report Conclusion",
};

const DEFAULT_CHECKLIST =
  "- Problem Statement\n- Research Objectives\n- Methodology Details\n- Implementation Walkthrough\n- Testing Metrics\n- Future Scope Limitations";

router.post(
  "/analyze-pdf",
  aiRoute(({ docType, text }) => {
    if (!docType || !text) {
      return { error: "docType and text are required." };
    }

    const checklist = PDF_CHECKLISTS[docType] || DEFAULT_CHECKLIST;

    return `
You are an expert academic document auditor and assistant.
Analyze the following text extracted from a ${docType} document.

Expected checklist items for "${docType}":
${checklist}

Provide your analysis in EXACTLY the following JSON format:
{
  "checklist": [
    { "title": "Section Title", "found": true }
  ],
  "summary": "Brief 2-3 sentence overview of the document's content and structure.",
  "insights": [
    "Specific professional insight about the text quality and style.",
    "Another insight...",
    "Another insight..."
  ],
  "tips": [
    "Specific actionable tip to improve the missing/weak sections.",
    "Another tip...",
    "Another tip..."
  ]
}

Ensure the checklist contains every expected item listed above.
Do not wrap your response in markdown code blocks. Return only the raw JSON string.

Document Text:
${String(text).slice(0, 6000)}
`;
  })
);

export default router;
