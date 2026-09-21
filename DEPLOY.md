# Deploying TaskPanda AI

Target setup: **Firebase Hosting** (frontend) + **Cloud Run** (AI service) +
**Firestore / Auth / Storage**, all in one Firebase project.

The repo is configured for this. What follows is the part that needs your
accounts and credentials.

---

## 0. Before anything else — rotate the Gemini key

The old key was compiled into a published bundle, so treat it as public.

1. Revoke it in Google AI Studio and create a new one.
2. Keep the new key **out of the frontend**. It only ever goes into Cloud Run's
   environment (step 3). Anything named `VITE_*` is inlined into the browser
   bundle and readable by every visitor.

---

## 1. One-time Firebase setup

```bash
npm install -g firebase-tools     # if you don't have it
firebase login
firebase use --add                # pick your project, alias it "default"
```

In the Firebase console:

- **Build → Storage → Get started** (creates the bucket the PDF manager uses).
- **Upgrade to the Blaze plan.** Cloud Run needs it. The free monthly allowance
  is generous; a project this size normally costs nothing, but a card is
  required. Set a budget alert if you want a safety net.

---

## 2. Deploy the security rules first

Rules sitting in the repo protect nothing. Ship them before the app is public.

```bash
npm run deploy:rules
```

Both rule sets are covered by tests — run `npm run test:rules` (49 assertions)
if you change them.

---

## 3. Deploy the AI service to Cloud Run

```bash
cd backend
gcloud run deploy taskpanda-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-new-key-here
```

- The service name and region must stay `taskpanda-api` / `us-central1`, or
  update the rewrite in `firebase.json` to match.
- `--allow-unauthenticated` is correct here: Firebase Hosting forwards public
  browser traffic to it. The service holds no user data — it only relays
  prompts to Gemini.
- Once you know your hosting domain, lock down who may call it:
  `--set-env-vars ALLOWED_ORIGINS=https://your-project.web.app`

Check it: `curl https://<cloud-run-url>/api/health` → `{"status":"ok"}`

---

## 4. Frontend environment variables

The build reads these from `frontend/.env`. They come from
**Project settings → Your apps → SDK setup and configuration**:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

These are *meant* to be public — Firebase identifies your project with them and
your security rules do the actual protecting. Do not add the Gemini key here.

Make sure `VITE_USE_FIREBASE_EMULATOR` is **not** set to `true`, or the live
site will try to reach emulators on the visitor's own machine.

---

## 5. Deploy the site

```bash
npm run deploy
```

This builds the frontend and ships hosting + rules. Your URL will be
`https://<project-id>.web.app`.

---

## 6. Authorise the domain — the step everyone forgets

**Authentication → Settings → Authorized domains → Add domain**, and add
`<project-id>.web.app` (plus any custom domain).

Without it, login and registration fail on the live site with
`auth/unauthorized-domain` while working perfectly on localhost.

---

## 7. Smoke test the live site

- [ ] Register a new account → lands on the dashboard
- [ ] Log out, log back in
- [ ] Create, complete and delete a task
- [ ] Upload a PDF, reload the page, confirm it is still listed
- [ ] Generate an AI schedule (exercises Cloud Run)
- [ ] Open it on a phone

---

## Redeploying

| Change | Command |
|---|---|
| Frontend only | `npm run deploy:hosting` |
| Rules only | `npm run deploy:rules` |
| Backend only | `gcloud run deploy taskpanda-api --source backend --region us-central1` |
| Everything | `npm run deploy` |

---

## Known limitations at launch

- **A user can still edit their own XP and coins.** Rewards are written from the
  browser, so rules cannot tell a real award from a devtools edit. Moving the
  reward writes into a Cloud Function closes it (~30 lines) and would also
  restore cross-user team rewards, which the current rules deliberately block.
- **Profiles are readable by any signed-in user.** The team screens look up a
  member's uid by email, which requires it. Names, emails and XP are visible to
  other signed-in users.
- **The landing page stats are placeholders** ("500+ Students"), not real
  numbers.
- **Notification preferences save but drive nothing** — no email or digest
  feature exists behind those toggles yet.
