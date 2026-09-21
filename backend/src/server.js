import app from "./app.js";

// Local development entry point. On Vercel the app is invoked per-request via
// api/index.js instead, so nothing listens on a port there.
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`TaskPanda AI service listening on http://localhost:${PORT}`);
});
