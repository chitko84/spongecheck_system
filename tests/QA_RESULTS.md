# Phase 7 QA Results

## Browser / UI tests executed

| Suite | Result | Evidence |
|---|---|---|
| New Phase 7 reporting UI | PASS | Downloaded inspection PDF, embedded-photo HTML, JSON, summary PDF, CSV; verified data and responsive layout at 7 widths |
| Phase 1 offline UI smoke | PASS | Landing, role, navigation, report, theme, multiple mobile widths |
| Phase 2 visual and interactions | PASS | Intro, guided tour, page sections and desktop/mobile navigation |
| Extended UI | PASS | Settings, guest restrictions, report storage, map, Telegram disconnected state |
| Phase 5 full workflow | PASS | Propose, specialist approval, manager assignment, after-work photo, verification and event history |
| Phase 6 Telegram UI | PASS | Connection handling, case photo and authorized dashboard, mobile layouts |
| Phase 6 backend tests | PASS | Webhook secret, allowlist, photo intake, deduplication, storage, restricted dashboard |
| Deterministic priority engine | PASS | 13 assertions |
| Workflow state machine | PASS | 20+ assertions |
| Old Phase 3 full browser script | INTERRUPTED | Navigation context destroyed during React remount; not counted as pass |
| Old Phase 4 full browser script | TIMED OUT | Rain toggle itself and deterministic calculations passed separately |
| Production Vite/React 18 bundle | NOT VERIFIED | Dependency packages unavailable in workspace; `npm run build` failed with missing React module/type declarations |

## Artifacts inspected
- `inspection.pdf` parsed as a valid two-page PDF 1.4; text and demo disclaimer extractable, image rendered and visually inspected.
- `two_photos.pdf`: test PDF containing two embedded JPEG image objects; inspected with `pdfimages -list`.
- Evidence HTML includes embedded initial image; exported JSON carries all confirmed observations and demo notice; exported CSV carries case status.
- New UI has responsive 320–1440px screenshots and no uncaught JavaScript browser errors in Phase 7 acceptance test.

## Product-versus-demo truthfulness
- Synthetic weather + sample location data remain clearly labeled.
- No actual AI photo inference: prewritten sample observations or manual user observations only.
- No real Telegram connection without BotFather token and HTTPS deployment.
- Local demo roles must not be treated as production access control.
- PDFs and exports are **documentation of sample workflow**, not evidence of flood reduction, ecological benefit, or legal approval.
