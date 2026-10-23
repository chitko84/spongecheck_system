# SpongeCheck 2.0 — Phase 8 Release Candidate

**All eight planned implementation milestones have been addressed.** Source includes mobile-first UI, fictional Places, three-step photo inspection, sample rain simulation with explainable decisions, nature-review gates, maintenance/verification timelines, actual PDF and data exports, and a Telegram bot backend that has been tested with mocked Telegram API messages.

**This project has NOT been deployed to a public URL and has NOT passed a React 18/Vite production build in the current isolated environment.** BotFather/live Telegram access remains unconfigured.

## Start here

- **Standalone offline demo:** `SpongeCheck_Phase8_Standalone_Demo.html` — open in Chrome/Edge; runs a separately transpiled, locally bundled legacy React UMD browser preview. Telegram says **Not connected** without a backend.
- **Full React source:** `src/`, `package.json`, `vite.config.ts`, `public/`. On a normal computer: `npm install`, `npm run typecheck`, `npm run build`, `npm run dev`.
- **Backend:** `server/`, `.env.example`, `TELEGRAM_SETUP.md`. Host Node on persistent storage before attempting real Telegram integration.
- **Release guide:** `release/DEPLOYMENT_READINESS.md`.
- **Five-minute presentation:** `release/FIVE_MINUTE_DEMO_RUN_OF_SHOW.md`.
- **Hackathon deliverables:** `release/SUBMISSION_CHECKLIST.md`.
- **Exact test status and limitations:** `release/FINAL_QA_REPORT.md`.

The important internal modules are `src/decisionEngine.ts`, `src/caseWorkflow.ts`, and `src/reportExport.ts`; they are shared by the app and its offline preview. Do not replace the current evidence-backed logic with decorative mock screens.

## No-dead-click requirement

All 155 JSX buttons have explicit action handlers in the source. Browser suites tested full core workflows and visible transitions. Any future additions must have an implemented action, honest disabled state, or be removed before recording. A source-level handler audit does not prove every edge case or network call.

## Team handoff

Do not submit the preview HTML as proof of a production React 18 build. First verify a genuine Vite build on an npm-enabled workstation, then deploy HTTPS frontend, check real mobile behavior and finalize the official ten-slide deck and five-minute video or accepted live link. Do not upload private bot credentials, keys, unrelated student photos or real user data to the public repository.
