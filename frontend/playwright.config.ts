// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Tests run against the Firebase emulators (started by `npm test` at the repo
// root), so they never touch the real project and start from a clean database.
const PORT = 5199;

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Playwright starts (and stops) the dev server itself, pointed at the
  // emulators. Previously baseURL assumed a server was already running on 5173.
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      // The emulators accept any project id; a demo- prefix keeps it obvious
      // that this is never the production project.
      VITE_FIREBASE_PROJECT_ID: 'demo-taskpanda',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-taskpanda.firebaseapp.com',
      VITE_FIREBASE_APP_ID: 'demo-app-id',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-taskpanda.appspot.com',
    },
  },

  // Chromium only by default so `npm test` is fast and reliable. Add the other
  // browsers back once `npx playwright install firefox webkit` has been run.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
