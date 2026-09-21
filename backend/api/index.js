// Vercel serverless entry point: every request is handed to the same Express
// app used locally. vercel.json routes all paths here.
export { default } from "../src/app.js";
