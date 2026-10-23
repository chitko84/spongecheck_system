# SpongeCheck 2.0 — Phase 8 Release Candidate

**Read [README_PHASE8.md](README_PHASE8.md) first.** This package includes the enhanced mobile-first sample app, the Telegram backend, real case reports and all eight planned phases. A React 18/Vite production build and public hosting are not yet verified.

---

# SpongeCheck 2.0 — Phase 6 Source (all earlier phases included)

**Phase 6 adds an executable Telegram bot backend and a mobile-first read-only Telegram inbox.** Previous inspection, Rain Simulator, Decision X-Ray, approvals, activity history, and before/after workflows remain in place. No BotFather credentials are included. No real Telegram service has been connected in this download.

## Start

To run the standalone UI, open `SpongeCheck_Phase6_Standalone_Demo.html`. This self-contained preview works offline and shows SpongeBot as **Not connected**, plus a clearly labeled sample conversation. For **real Telegram API integration**, see `TELEGRAM_SETUP.md`.

With Node 20+ and npm access:

```bash
npm install
npm run dev
# in a second terminal, with proper private .env configured:
node --env-file=.env server/start.mjs
```

The frontend defaults to `/api` on the same origin; Vite development proxy forwards it to the backend at port 8787. Deployed split-origin backend URLs can be entered in the Telegram UI (HTTPS required). The React 18/Vite production build has **not** been verified in the current restricted runtime.

## Phase 6 tests

```bash
node tests/phase6_spongebot_test.mjs
python tests/phase6_ui_test.py
node tests/decision_engine_test.cjs
node tests/case_workflow_test.cjs
```

The backend test uses an entirely mocked Telegram API and a temporary disk; it does not require tokens. Browser preview uses a locally bundled older React UMD runtime for no-npm testing; production React 18 compilation needs independent validation.

## Privacy and truthfulness

The bot supports an explicit numeric Telegram allowlist, a secret webhook header, exact-origin CORS and authenticated read-only access to photos and reports. The dashboard access key is typed by a user and kept only in the open page memory, never saved to localStorage. Keep the backend files outside the web root. The app does not auto-label a Telegram photo as AI-analyzed or authorized work. Telegram-origin cases are kept separate from the locally simulated maintenance workflow and cannot bypass approvals.

Other source details and original design remain in `MASTER_BLUEPRINT.md`, `PHASE_STATUS.md` and `tests/QA_RESULTS.md`.

---

## Previous project README (Phase 5)

# SpongeCheck 2.0 — Phase 5 Complete Source

An original mobile-first stormwater inspection prototype using the **Crimson Current** burgundy/ivory/navy theme. The design uses familiar labels such as **Home, Places, Report, Approvals, Before & After, Activity history**.

## Start the React app

On a machine with Node.js 20+ and network access to npm:

```bash
npm install
npm run dev
npm run build
```

Open the development address printed by Vite. The shipped React project uses React 18, TypeScript, Vite and CSS/Tailwind tooling. A live Telegram API is **not** included yet.

## Preview without npm

Open `SpongeCheck_Phase5_Standalone_Demo.html` in a browser. It bundles a working React UMD-based preview and visual assets for offline review. This browser preview is separately transpiled and **does not substitute for a verified Vite production build**. Some browsers restrict file-backed localStorage; the standalone preview then uses in-memory storage which does not survive reopening. A hosted app will use normal origin-based browser storage.

## What to click — complete judge story

1. On the welcome screen select **Explore the demo**, choose **Field inspector** and continue.
2. Go to **Report**. Pick **Reed Habitat (B-02)**, choose the labeled example photo, confirm observations and save a report.
3. Open **Manage work** on the saved report. Choose **Clear vegetation** and save the proposal. It moves to **Waiting for specialist review**.
4. Switch the **Demo role** selector to **Nature reviewer**. Enter a review reason and approve; optionally test rejection on a second case.
5. Switch to **Operations manager**, assign the work to a team.
6. Switch to **Field inspector**, start work, upload an after-work photo, enter completion notes and submit.
7. Open **Compare before & after**, drag or use arrow keys on the comparison slider.
8. Switch to **Operations manager**, enter a verification note, then verify or return for rework.
9. Open **Activity history** and **Approvals** to review the exact events and state. Test **Rain simulator** and **Why this needs attention** independently. Both use the shared Phase 4 decision engine.

**Important:** The roles and actions above are simulated for judging, not identity-verified employees or legally authorized work. Sample images and rainfall are synthetic/illustrative. There is no live AI detection or real flood-risk calculation.

## Components and important files

- `src/App.tsx` — interactive mobile+desktop UI, navigation, sample assets, inspection wizard, updates, case detail, approvals, evidence and settings.
- `src/decisionEngine.ts` — reusable transparent dry/moderate/heavy inspection priority and intervention review recommendation.
- `src/caseWorkflow.ts` — deterministic case state transitions, actor gating, audit events, error messages and confirmation rules.
- `src/styles.css` — visual design, responsive layouts, interactive comparison and animation styles.
- `public/assets/` — bundled original imagery, with sources/credits in `image-credits.md`.
- `tests/case_workflow_test.cjs` — transition and invalid-action tests.
- `tests/phase5_workflow_test.py` — browser end-to-end happy path and breakpoint checks.
- `tests/phase4_rain_decision_test.py` — Phase 4 decisions/regression tests.
- `tests/phase3_inspection_test.py` — inspection/regression tests.
- `tests/QA_RESULTS.md` — truthful verification summary.
- `MASTER_BLUEPRINT.md` — original enhanced 12-screen specification.

## Testing constraints

The offline React browser test harness uses a locally available older React UMD runtime, not the React 18 package defined in `package.json`. The tests validate UI behavior and module logic, but **not** the Vite production build. Browser state is a sandbox and should not be trusted for real operations, authorization, immutable records or data confidentiality. A server-side data store and verified identity are prerequisites for real deployments and the live Telegram integration.

## Phase 6 next

Build secure Telegram `/inspect` → authorized case creation → saved photograph → dashboard notification through a reachable backend and shared database. Never place bot tokens in frontend source.


## Real photography (2026-10-23 refresh)

Eleven distinct Pexels free-use photos replace the reused illustrated backgrounds and asset cards. For offline/deployment reliability, run `npm run photos:download` **before** `npm run dev` or `npm run build`, using a PC with internet. Read `PHOTO_INSTALLATION.md` and `image-credits.md`.
