# SpongeCheck 2.0 — Phase 8 QA and release status

**Reviewed:** 23 October 2026. **Result:** Offline functional release candidate **PASS**, but **public deployment / React 18 production build NOT VERIFIED**. This is an honest release audit, not a production certification.

## Source and regression checks

| Area | Phase 8 result | Verification |
|---|---|---|
| Shared decision logic | PASS | 13 deterministic rule assertions; wetland sensitivity separated from rainfall-based inspection priority |
| Case workflow guards | PASS | 20+ state and role-guard assertions |
| Telegram API | PASS in controlled test | Secret, allowlist, photo submission, duplicate update IDs, private records, CORS, `/status`, manager notifications using mocked Telegram API |
| Welcome and premium layout | PASS | Phase 2 browser test; intro skip, tour, mobile and desktop |
| Navigation and user actions | PASS | Basic and extended browser UI tests; Places, filters, reports, updates, settings, reset and guest restrictions |
| Photo inspection | PASS | Full three-step browser test, user-controlled observations, photo upload, validation, persistence across React remount, read-only guest, responsive widths |
| Rain Simulator + Decision X-Ray | PASS | Full Phase 4 browser end-to-end test; actual dry/moderate/heavy recalculation, matching factors, uncertain-data outcome |
| Approval → work → evidence → verification | PASS | Complete Phase 5 browser flow and role restriction checks |
| Telegram UI | PASS using mocked backend | Bad key, disconnected status, photo-case display, dashboard listing, mobile layouts |
| PDF/HTML/JSON/CSV report exports | PASS | Browser downloads, actual PDF header, photo evidence, summary counts and responsive Reports page |
| Static interaction inventory | PASS | **155 JSX buttons**, all with explicit `onClick` handlers; one link; no `href="#"`. This static audit does not prove every state transition |
| Responsive browser checks | PASS | 320, 360, 390, 430, 768, 1024, 1440 CSS px in applicable suites; no horizontal overflow |
| HTML offline preview generation | PASS | Portable script generated updated offline React preview; no npm download required for this legacy preview within this environment |
| React 18/Vite production install | **BLOCKED** | npm registry unavailable; `npm install --offline` fails `ENOTCACHED`; online install stalled and was stopped |
| React 18/Vite `npm run typecheck`, `npm run build` | **NOT VERIFIED** | Commands fail due **missing `react` and `@types/react`**, followed by resulting JSX/type errors. Resolve dependencies before deciding whether further code changes are needed |
| Public website/HTTPS links | **NOT DONE** | No hosted deployment or GitHub repository was created or updated in this run |
| Real Telegram delivery | **NOT DONE** | BotFather credentials, webhook registration, persistent backend hosting and authorized Telegram user are absent |
| Real iOS Safari/Android Chrome hardware | **NOT VERIFIED** | Emulated viewport testing only; physical-device QA remains |

## Phase 8 fixes and additions

1. **Portable offline-preview builder:** No hard-coded project-specific Jupyter paths needed on a developer machine when local npm dependencies and the shipped UMD assets are present.
2. **React preview remount test corrected:** Test no longer returns a React component instance for browser serialization. Phase 3 full suite now passes.
3. **Safer settings/intro storage:** Browser session storage restrictions no longer crash basic theme, role, intro and demo-reset actions. Scheduled intro timer is cleared during unmount.
4. **SPA deployment routing:** `vercel.json` and Netlify `public/_redirects` added for browser refreshes on nested routes.
5. **Interaction inventory:** 155 button handlers audited using the TypeScript AST. Full UI click-through still depends on browser QA, as above.
6. **Documentation and submission:** `release/DEPLOYMENT_READINESS.md`, `release/FIVE_MINUTE_DEMO_RUN_OF_SHOW.md` and `release/SUBMISSION_CHECKLIST.md` included.

## Known limitations

- The app is a *functional sample scenario*; it is **not** a deployed wetland inspection tool. Simulated rain is not an official forecast; no calibrated flood model or live image AI exists.
- Demo identities and ecological approvals are **not secure real-world permissions**. This project should not direct or approve field work without proper engineering and ecological review.
- Browser practice reports and remote Telegram cases live in separate stores. A shared multi-user backend and trusted identity system are future work.
- The on-disk Telegram JSON backend requires a persistent server, private credentials and a data-retention policy; it must not be deployed as an ephemeral serverless function.
- Remote free stock imagery is not evidence of actual SDP infrastructure. Original bundled visual assets are used for key screens; review credits/licenses before publication.
- No final pitch deck or recorded demo video was generated during Phase 8. Submission and portal confirmation remain manual team responsibilities.

## Go/no-go recommendation

**GO** for a controlled offline judge rehearsal of the React preview, with clear demo labels. **NO-GO for claiming a fully deployed, live-production prototype** until the React 18/Vite build, HTTPS deployment and actual public URLs are independently verified. Live Telegram is optional for the hackathon; show the explicitly labeled sample conversation if it cannot be activated safely.
