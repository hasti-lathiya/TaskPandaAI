import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRouter from "./ai.js";

// The Express app is built here and exported without listening, so the same
// code can run as a long-lived server locally (src/server.js) and as a
// serverless function on Vercel (api/index.js).
const app = express();

// Restrict who may call this service. ALLOWED_ORIGINS is a comma-separated
// list; with none set (local development) any origin is accepted.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length > 0
      ? {
          origin: (origin, callback) => {
            // Same-origin and server-to-server requests have no Origin header.
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Origin not allowed"));
          },
        }
      : {}
  )
);

app.use(express.json({ limit: "1mb" }));

// AI generation runs server-side so the provider key never reaches the browser.
app.use("/api/ai", aiRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
