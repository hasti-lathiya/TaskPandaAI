import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const generateInternshipReport = async (tasks) => {
  const prompt = `
Convert the following internship tasks into a professional weekly internship report suitable for college submission.

Tasks:
${tasks}

Generate:
- Professional language
- Paragraph format
- Internship report style
- Mention technical contribution
`;

  const result = await model.generateContent(prompt);

  return result.response.text();
};

export const generateAISchedule = async (tasks) => {

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

  const prompt = `
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

  const result = await model.generateContent(prompt);

  return result.response.text();
};

export const recommendTeamAssignee = async (taskTitle, taskDesc, members, activeTasksCount) => {
  const memberDetails = members
    .map(
      (member) => `
- Email: ${member.email}
  Role: ${member.role}
  Active Tasks Count: ${activeTasksCount[member.email] || 0}
`
    )
    .join("\n");

  const prompt = `
You are an AI workload balancer and assistant.
Recommend the most suitable team member to assign the following task to.

Task Title: ${taskTitle}
Task Description: ${taskDesc}

Team Members:
${memberDetails}

Guidelines:
- Analyze active tasks count (prefer members with fewer active tasks to balance workload).
- Align task title/description with the role (Internal vs External).
- Return your recommendation in a clean, short, professional paragraph (max 3 sentences). Mention the recommended member's email, why they were chosen, and why it balances the workload.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI recommendation error:", error);
    return "Could not generate AI recommendation at this time.";
  }
};