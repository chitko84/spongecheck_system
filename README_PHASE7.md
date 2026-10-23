# SpongeCheck 2.0 — Phase 7 source handoff

This is the **complete Phase 6 source project with Phase 7 additions**, not a new independent mock application.

## Getting started on your computer
1. Unzip the archive.
2. `cd SpongeCheck_Phase7_Source`
3. `npm install` (internet / a working npm registry required).
4. `npm run dev` for React + Vite local development.
5. `npm run build` for a production bundle (still unverified in our offline workspace).
6. To run the optional Telegram backend, follow `TELEGRAM_SETUP.md`. Keep secrets in server env variables.

## Standalone preview
Open `SpongeCheck_Phase7_Standalone_Demo.html` in your browser. It embeds the UI, styles and local art and can run without npm. Its React-16-based compatibility bundle is a **visual/interaction preview**; the shipping React-18/Vite build still needs checking.

## Phase 7 pages and downloads
- New Reports & Insights: `/app/insights`. Reach it through desktop sidebar, My Reports and mobile More.
- My Reports → open a saved inspection → **Download PDF**, **Evidence with photos**, **Export case data**.
- Reports & Insights → **Download summary PDF**, **Download CSV**; period filter affects both summary totals and the exported case list.
- PDF documents include the rules used to make the decision, the current *sample* rainfall scenario, case status, approval/verification state, and evidence photos if saved.
- HTML evidence is a standalone report with embedded images (no separate asset files). JSON contains the full structured case record; CSV is a summary for a spreadsheet tool.
- Telegram-origin cases are separate, authorized backend records and excluded from browser-only exports.

## Quality gates
Run `python tests/phase7_reporting_ui_test.py` after creating the offline preview with `node build-offline-preview.cjs`. Details and exact limitations in `PHASE_STATUS.md` and `tests/QA_RESULTS.md`. Do not imply live Telegram or AI image classification unless real services are configured.

## Scope
Frontend: React + TypeScript + Vite + CSS (Tailwind config retained). Colors: burgundy `#5B1E35`, cream `#F8F5F2`, midnight `#19273E`, coral `#ED674B`. Backend Telegram: Node standard HTTP server using secure webhook handling. Local reports saved in browser storage. Artificial rainfall, asset data and example labels are conspicuously indicated as **demo**.
