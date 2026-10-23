# SPONGECHECK 2.0
## Mobile-First Frontend ASCII Master Blueprint
**Visual identity:** Crimson Current · **Competition:** Sime Darby Property University Hackathon 2026 · **Primary track:** PLANET  
**Document type:** Design and engineering handoff for development in ChatGPT or Claude Code · **Planning date:** 21 October 2026  
**First-stage submission:** 23 October 2026, 11:59 PM MYT  
**Status:** Proposed UI/UX and MVP specification; screens, data, model capabilities, and integrations are not claimed to be implemented.

---

# NON-NEGOTIABLE UX UPDATE — NATURAL LANGUAGE + ZERO DEAD CLICKS

**Status:** Required acceptance standard, not a description of currently built functionality.

## Design benchmark: easy to use, not full of engineering vocabulary
Borrow the clarity of YouTube, Pinterest, LinkedIn and other mature consumer apps: recognizable navigation, card tap targets, discoverable next steps, obvious progress, consistent back navigation, useful empty states, and short text. Do not copy their branding or layouts. A first-time visitor should understand how to report an issue without training.

- Put the **task first** and the brand-specific name second. Prefer `Check a photo` with a smaller `VisionScan` identifier rather than `Initialize VisionScan AI`.
- Prefer verbs and ordinary nouns: `Home`, `Places`, `Report an issue`, `Updates`, `More`, `My reports`, `Why this needs attention`, `Ask for approval`, `Before & after`.
- On screen, speak to the user: `We found possible debris. Please check the photo.` Not `Model produced obstruction-classification logits`.
- Reserve correct specialist language (`ecological review`, `rainfall scenario`, `asset`) for detail panels, explanations, footnotes and expert views. Display a short plain-language explanation nearby.
- Never imply sample data are live. Use small but visible labels: `Sample location`, `Demo rainfall`, `Example photo analysis`, `Demo access`. Keep them in exports and recording as well.
- Write clear helper text, not paragraph walls. Headings should usually be 2–6 words; button labels should clearly describe the action. Friendly and credible, never gimmicky during urgent tasks.

### Product naming map: internal vs. user-facing

| Internal / brand feature | Recommended label in navigation, screen header or button | Supporting copy |
|---|---|---|
| Operations Center | `Home` / `Overview` | `Here's what needs attention.` |
| Asset Explorer / Asset Passport | `Places` / `Place details` | `See drains, wetlands, and nearby inspection history.` |
| VisionScan AI | `Report an issue` / `Check a photo` | `Take a photo or choose one from your phone.` |
| StormShift | `Rain simulator` | `See how inspection priorities change in sample rain conditions.` |
| TwinPulse | `Needs attention` + `Needs approval` | `Inspecting a place is different from approving work.` |
| Decision X-Ray | `Why this needs attention` | `See what information led to this suggestion.` |
| EcoShield | `Approvals` / `Review request` | `Some work must be checked by a specialist first.` |
| ProofFrame | `Before & after` | `Compare photos and confirm what was done.` |
| Evidence Ledger | `Activity history` | `See updates, photos, and decisions for this report.` |
| SpongeBot | `Telegram updates` | `Report issues and receive updates through Telegram.` |
| Reports & Settings | `Reports`, `Settings` | `View progress or change how the app works.` |
| Role Selection | `Explore demo` / `Choose your role` | `Try sample tasks without a real account.` |

**Mobile primary tabs:** `Home | Places | Report | Updates | More`. The central `Report` action opens the photo-first flow. Brand features can still appear as attractive card titles, with a plain-English subtitle. **Desktop sidebar:** `Overview, Places, Report an issue, Rain simulator, Decisions, Approvals, Activity history, Telegram, Reports, Settings`. Both can use the underlying existing routes; these are label changes, not new product modules.

## Interaction contract: if it looks clickable, it must do something

**The zero-dead-click rule:** every visible button, nav item, chip, toggle, image action, search field, menu, card with a hover affordance, and notification row must have one testable and meaningful result. Do not create clickable-looking decorations. Never show a toast saying something succeeded if the underlying save, send or permission check failed.

For each action, specify: **trigger → result → visible feedback → failure/retry path**. Disable incomplete features with a short reason, hide non-essential unfinished features, or implement an explicitly labeled **Explore an example** mode. No fake `Coming soon` clickable buttons in the recorded demo.

### Per-screen click-through acceptance table

| Screen | Controls that must work | What users should see afterward |
|---|---|---|
| 01 Welcome | Logo to Home; `Explore demo`; `See how it works`; menu; feature tiles | Correct route, real guided tour or actual explanatory section; no inert decorative links |
| 02 Access | Back, choose role, continue demo, help/privacy links | Chosen sandbox role and appropriate Home view; obvious `Demo account` banner |
| 03 Home | Scenario card, summary cards, inspection rows, notification icon, `New report`, bottom tabs | All open the matching filtered list, case detail, simulator or new report; counts match stored cases |
| 04 Places | Search, filter chips, map pins, map/list switch, sheet expand/collapse, `View details`, `Report issue` | Actual filtered records and detail pages; a selection keeps the same asset across map and list |
| 05 Report | Asset dropdown, phone camera/file picker, preview/remove/retry, `Check photo`, observation selectors, next/back, `Submit report` | Accurate processing status, inspector-editable labels, validation, persisted case, unique ID and success screen |
| 06 Rain simulator | Dry/Moderate/Heavy tabs, compare mode, priority cards, `Why did this change?`, reset | Recomputed rankings from the same underlying rule engine; visible explanation and explicit sample-data label |
| 07 Decisions | Factor accordion, evidence/photo links, `Request inspection`, `Ask for review`, back | Shows actual rule factors; creates a status/action record; no automatic permission to perform work |
| 08 Approvals | Open case, review notes, `Approve`, `Reject`, return/request more details | Action is blocked for non-reviewers; permitted demo reviewer records reason, timestamp and new case state |
| 09 Before & after | Photo slider, photo zoom, checklist, `Record verification`, back | Accessible image comparison; validation and event record; cannot claim hydraulic/ecological outcome is verified |
| 10 Telegram | Bot link, connection status refresh, example chat, activity rows, optional test action | Opens real bot when configured, otherwise shows honestly labeled demo; cannot claim messages sent when not sent |
| 11 Activity | Search/filter, expand event, photo links, decision links, export | Every row opens its supporting evidence; export contains the displayed case and provenance |
| 12 More/Reports | Report period, export, language, theme, reduced motion, privacy/credits, reset demo | Settings affect the actual UI; export downloads; reset confirms and restores deterministic sample data |

**Shared interactions:** Browser Back and in-app Back work; loading, empty, error, offline and permission-denied states exist; dialogs have working Close/Cancel; all tabs contain content; notifications point to cases and can be dismissed/read; toast copy reflects real outcomes.

## Beginner-friendly microcopy examples

| Avoid | Use instead |
|---|---|
| `Instantiate an inspection entity` | `Start a report` |
| `Upload evidentiary media` | `Add a photo` |
| `AI obstruction confidence score` | `Possible blockage — please check` |
| `Hydrometeorological scenario ingestion` | `Try a rain scenario` |
| `Intervention authorization required` | `Approval needed before work starts` |
| `Inspect inference provenance` | `Why did we suggest this?` |
| `Pending audit closure` | `Waiting for someone to confirm the work` |
| `Asset registry` | `Places we monitor` |
| `Escalation initiated` | `Sent for review` |
| `Synthetic seed state` | `Sample information for this demo` |

**Example core journey in natural language:**
1. `Report an issue` → `Choose a place` → `Add a photo` → `Review what we found` → `Send report`.
2. `Try heavy rain` → `See what needs attention first` → `Why did this change?`.
3. `Approval needed` → `Ask a specialist to review` → `Approve / Reject` (authorized demo role only).
4. `Work completed` → `Add an after photo` → `Confirm the work` → `See activity history`.

## Consumer-quality interaction details

- **Mobile:** use one obvious sticky primary action when needed; a 5-tab bottom bar; touch-friendly cards; native-feeling photo picker; keyboard-safe forms; large screen headings; 44px minimum tap targets; no horizontal scrolling at 320px; accessible bottom sheets.
- **Desktop:** sidebar, search and detail panels; familiar cards and tables; equivalent functionality with keyboard support.
- **Design:** premium does not mean confusing—avoid excessive glass, microscopic text, mystery icon-only buttons or animation that hides status. Use clear typography, approachable illustrations/photography, immediate response and unobtrusive confirmation.
- **Progress feedback:** when an action takes longer than a moment, show a real loading state; show success only after persistence/API acknowledgement. For failure, explain plainly, preserve input and provide `Try again`.
- **Photo honesty:** sample stock photos are labeled illustrative; prerecorded image labels are `Example photo analysis`, never `AI detected` unless real inference ran.
- **Telegram honesty:** no bot secret in the frontend, real connectivity status, no fake webhook updates. A simulated chat is marked `Example conversation`.
- **Accessibility:** labels and status aren't conveyed by color alone; touch and keyboard work; reduced-motion alternative; alt text and visible focus.

## Automated and manual quality gate — mandatory before recording

Use Playwright or equivalent browser-level tests, plus phone testing, for the following **end-to-end flows**, not just component snapshots:

1. From landing, enter demo, navigate all five mobile tabs and return without a blank page.
2. Open each desktop sidebar destination and verify screen content and back navigation.
3. Search, filter and open an asset from map and list; confirm the same record.
4. Upload/take a photo; edit observations; submit; refresh page; confirm case persists and counts update.
5. Change dry → heavy → dry; verify genuine deterministic reranking and matching explanation.
6. Request sensitive vegetation clearance; verify non-reviewer cannot approve; authorized demo reviewer can approve with a reason; modification invalidates previous approval.
7. Upload completion evidence; use before/after slider on touch and keyboard; confirm status recorded in history.
8. If Telegram is enabled, send a real `/inspect` message with a photo, confirm exactly one new case, reply/notification, and secure failure handling; otherwise demonstrate the **clearly labeled** mock only.
9. Export report and open the resulting file; reset demo and verify records restore consistently.
10. Verify 320, 360, 390, 430px and 1440px viewports; no dead links, console errors, overflow, obstructed buttons or broken images; test iOS Safari / Android Chrome when possible.

**Clickability audit:** enumerate all actual `<button>`, `<a>`, `role=button`, map markers, chips and menu items from the rendered app. Each gets an owner, destination/action, tested result and pass/fail state. Do not mark a phase complete if its visible controls are inert.

## Delivery / code-review rule

For every implementation phase, report:
- Screens actually built and routes accessible.
- Buttons and interactions exercised, including any intentionally hidden or disabled controls and why.
- Tested viewport sizes and test pass/fail summary.
- Where data are simulated vs. real.
- Unfinished items and what the next milestone includes.

**Deadline rule:** If a feature cannot be completed correctly in time, simplify or remove it. A smaller flawless demo is better than an impressive-looking page full of dead controls.

---

# 0. THE DESIGN CONTRACT

## Our north star
Build a **gorgeous, mobile-first, responsive web application** that feels like a polished native app on a 390 px phone and a professional command center on desktop. Use the **Fiverr-inspired editorial principles** from the reference screenshots—large typography, warm whitespace, premium photography, rounded service tiles, clear CTA hierarchy, and restrained motion—but **never copy Fiverr assets, trade dress, wording, or brand identity**. This is an original stormwater-operations product.

The two equally important priorities are:
1. **Visual polish:** confident, high-end design with first-class mobile interactions, real licensed imagery, polished empty/loading/error states and subtle animations.
2. **Functional credibility:** inspect an asset → analyze or validate evidence → change a simulated rainfall scenario → examine explainable inspection priority → require ecological authorization → verify maintenance → preserve an audit trail.

**Do not confuse these concepts:**
- An urgent **inspection** is not automatic authorization for intervention.
- Image analysis can identify **visual indicators**, not prove drainage capacity, hydraulic performance, water quality or ecological safety.
- The rainfall switch initially uses **synthetic demonstration inputs**, not a live meteorological feed.
- Mocked visual-analysis output must be unmistakably labeled **SIMULATED AI RESULT**. A real, tested model may instead display **MODEL INFERENCE — REQUIRES HUMAN REVIEW**.
- Do not use arbitrary made-up probabilities, flood reductions, carbon savings, field measurements or real asset coordinates.

## Primary users and permissions
| Persona | Main jobs | Allowed actions in prototype |
|---|---|---|
| Field Inspector | Capture evidence from a phone | Create inspections, upload photos, acknowledge task, propose completion |
| Operations Manager | See queues and assign work | Review priorities, assign approved tasks, mark operational progress |
| Ecological Reviewer | Check sensitive interventions | Approve/reject restricted actions with reason; cannot fabricate field evidence |
| Judge / Demo Guest | Explore predefined demo scenarios | Read-only tour and resettable sandbox interactions; cannot approve real work |

In a fast hackathon prototype, a **demo persona switch** is acceptable *only if labeled as simulated role access*. It must not be confused with production authorization. Real permissions require backend-enforced role checks.

---

# 1. VISUAL DESIGN SYSTEM — CRIMSON CURRENT

## Palette
| Token | Hex | Use |
|---|---|---|
| `brand.burgundy` | `#5B1E35` | Hero, logo accents, highlighted navigation |
| `brand.burgundyDark` | `#411528` | Dark hero overlay and hover |
| `surface.cream` | `#F8F5F2` | Main background |
| `surface.white` | `#FFFFFF` | Elevated surfaces and cards |
| `surface.ink` | `#19273E` | Dark command-center panels |
| `accent.coral` | `#ED674B` | CTA and active-state accents, subject to contrast checks |
| `accent.amber` | `#D89B4A` | Warm neutral accents and review indicators |
| `text.primary` | `#25222A` | Primary type |
| `text.secondary` | `#69646B` | Supporting text |
| `border.soft` | `#E8E1DF` | Input and card borders |
| `semantic.danger` | `#B42337` | Errors and urgent states (always add icons/text) |
| `semantic.success` | `#18794E` | Verified confirmations ONLY, not branding |

Use brand burgundy/ink/ivory for 90% of the experience. Semantic green can still indicate successful verification; avoiding a generic green sustainability theme does not mean removing meaningful success feedback.

## Typography and shapes
- Headings: **Manrope**, fallback sans-serif. Body/UI: **Inter**, fallback sans-serif.
- Hero: 36–44 px phone, 64–84 px desktop (clamp responsively); line-height 1.05–1.12.
- Screen titles: 26–30 px phone, 34–40 px desktop. Body: 15–16 px, line-height 1.5.
- Micro-labels: minimum 12 px; avoid illegible UI microtype.
- Card radius: 20–24 px; large hero radius 28–32 px; pill button radius 999 px.
- Core spacing unit: 4 px; common gaps 8 / 12 / 16 / 24 / 32 px.
- Touch targets: **at least 44×44 CSS px**, with adequate spacing.
- Focus outlines are visible; contrast target WCAG AA for text and functional UI.
- Shadow: soft, warm, subtle; no harsh neumorphism or excessive glassmorphism.

## Responsive breakpoints
- Small mobile: 320–359 px — still no clipped content or horizontal scroll.
- Main mobile: 360–430 px — **primary design and testing target** (390×844 reference).
- Large mobile/phablet: 431–639 px — increase breathing room, same navigation.
- Tablet: 640–1023 px — adaptive two-column content and wider panels.
- Desktop: 1024–1439 px — persistent left sidebar, utility top bar, 2–3 column grids.
- Large desktop: 1440+ px — max content width around 1440 px, no endless stretched cards.

**Viewport requirements:** safe-area insets (`env(safe-area-inset-*)`), keyboard-safe form layouts, sticky CTA where appropriate, no controls obscured by the bottom bar, graceful rotation to landscape, and support for reduced-motion preferences.

## Component inventory
`AppShell`, `TopBar`, `BottomNav`, `DesktopSidebar`, `HeroMedia`, `FeatureTile`, `StatCard`, `AssetCard`, `AssetPhoto`, `PriorityChip`, `ScenarioSelector`, `RiskPill`, `EvidenceTimeline`, `EvidenceCompare`, `InspectorStepper`, `ScanResultCard`, `DecisionFactor`, `ApprovalGate`, `SecureLinkNotice`, `MapAssetSheet`, `EmptyState`, `ErrorState`, `DemoDataRibbon`, `Toast`, `ConfirmDialog`, `FullScreenMedia`, `RolePill`, `CaseStatusStepper`, `MobileBottomSheet`, `SourceAttribution`.

## Navigation
**Public**: `/` welcome → `/demo` guided exploration → `/sign-in` access selector.  
**App bottom bar (mobile)**: `Home | Places | Report | Updates | More` (five familiar targets).  
**Persistent desktop sidebar**: Overview · Places · Report an issue · Rain simulator · Decisions · Approvals · Activity history · Telegram · Reports · Settings. Brand feature names may appear as subtitles.

Secondary screens (Decision X-Ray, approvals, photo comparator, full case details) are accessed via deep links, cards, drawers and breadcrumb/back navigation. Do **not** crowd the mobile nav with 12 tabs.

---

# 2. FULL MOBILE ASCII WIREFRAMES — TWELVE SCREENS

All diagrams show conceptual placement for a roughly **390 px mobile viewport**. Bracketed blocks are interactive components, not literal UI styling. Phone browser chrome and exact safe areas are omitted; the built design must account for them.

## SCREEN 01 — Welcome / Cinematic Landing
**Route:** `/` · **Job:** Premium first impression, immediate comprehension, accessible demo CTA.

```text
┌─────────────────────────────────────┐
│  ◉ spongecheck.               ☰    │
│─────────────────────────────────────│
│ ╭─────────────────────────────────╮ │
│ │  CINEMATIC WETLAND PHOTO        │ │
│ │  [dark burgundy / navy overlay] │ │
│ │                                 │ │
│ │  INTELLIGENT STORMWATER OPS     │ │
│ │                                 │ │
│ │  Every Drop.                    │ │
│ │  Every Decision.                │ │
│ │                                 │ │
│ │  Protect infrastructure.        │ │
│ │  Preserve nature.               │ │
│ │                                 │ │
│ │ ╭─────────────────────────────╮ │ │
│ │ │ Explore Interactive Demo  ↗ │ │ │
│ │ ╰─────────────────────────────╯ │ │
│ │       See how it works ▶        │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│  A smarter way to act               │
│  before the storm.                  │
│                                     │
│ ╭────────────╮ ╭────────────╮       │
│ │ VisionScan │ │ StormShift │ →     │
│ │   photo    │ │  scenarios │       │
│ ╰────────────╯ ╰────────────╯       │
│                                     │
│  [Featured full-bleed wetland photo]│
│  The ecosystem is part of the asset.│
│                                     │
│  HOW IT WORKS → 5 simple steps      │
│  Learn about our demonstration      │
└─────────────────────────────────────┘
```
**Behaviors:** One-time 1.8–2.2-second logo intro, always skippable; primary CTA opens guided demo. Feature tiles scroll horizontally with snap; no autoplay motion that hides content. Real licensed image with alt text and credit recorded in `image-credits.md`. On public screens, use a subtle top-right menu for About, Demo, Sign in.

## SCREEN 02 — Access / Role Selection
**Route:** `/sign-in` · **Job:** Elegant entry, transparent demo vs. real authentication.

```text
┌─────────────────────────────────────┐
│  ←                         Help ?   │
│                                     │
│ [ATMOSPHERIC STORM PHOTO / HEADER]  │
│                                     │
│      The field, connected.          │
│                                     │
│  ╭───────────────────────────────╮  │
│  │ Welcome to SpongeCheck        │  │
│  │                               │  │
│  │  Explore as a demo persona    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Field Inspector       ↓ │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  [ Continue in Demo Mode → ]  │  │
│  │                               │  │
│  │  SIMULATED ACCESS             │  │
│  │  Roles are for demonstration  │  │
│  ╰───────────────────────────────╯  │
│                                     │
│  [Production sign-in: future]       │
│  Source / privacy information       │
└─────────────────────────────────────┘
```
**Behaviors:** Demo persona switch reconfigures permitted UI and stores sandbox data separately; no faux Google/Apple login buttons unless OAuth is real. Explain data privacy before photo uploads. Desktop adapts into left image/right form split inspired by reference—not copied.

## SCREEN 03 — Operations Center
**Route:** `/app/overview` · **Job:** Know what needs attention and why.

```text
┌─────────────────────────────────────┐
│ ◉ spongecheck.          🔔    ◯     │
│                                     │
│ Good morning, Inspector             │
│ Operations Center                   │
│ DEMO TOWNSHIP • SYNTHETIC RECORDS   │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │  STORM CONTEXT         DEMO    │ │
│ │  Heavy rain scenario          │ │
│ │  Priorities recalculated      │ │
│ │  [Adjust Scenario →]          │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ ╭──────────────╮ ╭──────────────╮   │
│ │  06          │ │  03          │   │
│ │  Assets      │ │  Flags       │   │
│ ╰──────────────╯ ╰──────────────╯   │
│ ╭──────────────╮ ╭──────────────╮   │
│ │  01          │ │  02          │   │
│ │  Needs review│ │  Open cases  │   │
│ ╰──────────────╯ ╰──────────────╯   │
│                                     │
│ Inspection priorities       View all│
│ ╭─────────────────────────────────╮ │
│ │ [photo]  Wetland Outlet A-01    │ │
│ │          Urgent inspection     │ │
│ │          Why this priority  →  │ │
│ ╰─────────────────────────────────╯ │
│ ╭─────────────────────────────────╮ │
│ │ [photo]  Wetland Cell B-02      │ │
│ │          Eco review pending  → │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│        ⊕ New Inspection            │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Clear demo ribbon; stats derive from real sandbox store, not animated fake counts; asset cards deep-link to cases. Quick `⊕ New Inspection` prominent; notifications appear in Inbox and optional Telegram. Sticky bottom nav never covers the CTA. Skeleton loading for data access and focused errors for failed loads.

## SCREEN 04 — Asset Explorer / Living Map
**Route:** `/app/assets` · **Job:** Find an asset, inspect its history, begin a report.

```text
┌─────────────────────────────────────┐
│ ←  Asset Explorer          ☷ Filter│
│ [Search ID / asset type / status  ⌕]│
│ [All] [Outlets] [Wetlands] [Swales] │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │    INTERACTIVE TOWNSHIP MAP    │ │
│ │        • A-01       • B-02     │ │
│ │            • C-03              │ │
│ │   [ + ] [ - ] [ Recenter ]     │ │
│ │    Demonstration positions     │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ━━━  drag to expand           │ │
│ │ [photo] Wetland Outlet A-01    │ │
│ │ Outlet · Inspection flagged    │ │
│ │ Latest: Sample inspection      │ │
│ │                                 │ │
│ │ [ View Passport ] [ Inspect ]  │ │
│ └─────────────────────────────────┘ │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Map/list toggle, bottom sheet, filter chips, search by sample ID; pins must not represent invented real SDP infrastructure. A-01 opens a genuine Asset Passport containing photo history, assigned responsible party (sample), checklist template, and current case status. Map attribution required if using OSM-based tiles; local schematic map is an acceptable first-round fallback.

## SCREEN 05 — VisionScan AI / Mobile Inspection Wizard
**Route:** `/app/inspect` · **Job:** Make field reporting fast and credible.

```text
┌─────────────────────────────────────┐
│ ← New Inspection           Step 1/3 │
│ ███████░░░░░░░░░░                  │
│                                     │
│ Select asset                        │
│ [Wetland Outlet A-01            ▾]  │
│                                     │
│ Capture evidence                    │
│ ╭─────────────────────────────────╮ │
│ │                                 │ │
│ │          PHOTO AREA            │ │
│ │                                 │ │
│ │   [ Take Photo ] [ Upload ]     │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ [ Analyze sample / uploaded photo ] │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │ VISUAL OBSERVATIONS             │ │
│ │ [Demo/Model status shown here]  │ │
│ │ Debris visible?    [Yes ▾]     │ │
│ │ Sediment visible?  [Unsure ▾]  │ │
│ │ Vegetation?        [Yes ▾]     │ │
│ │ Inspector confirms all fields  │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ Notes [__________________________]  │
│ [ Continue → Review & Submit    ]   │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Wizard stages `Asset & Photo → Observations → Confirm & Create Case`. Preview/crop photo locally if possible; compress only after preserving reasonable evidence quality. In real-model mode, show provider/model status, uncertainty and editable observations. In predefined-demo mode, show **SIMULATED AI RESULT — SAMPLE LABELS** prominently. No mock bounding boxes presented as genuine detection. Offline/failed upload shows retry and preserves entered form data. One-hand camera-first UX, 44 px controls.

## SCREEN 06 — StormShift Scenario Lab
**Route:** `/app/stormshift` · **Job:** Visually demonstrate recalculated inspection priorities.

```text
┌─────────────────────────────────────┐
│ ← StormShift              DEMO DATA│
│                                     │
│ When the weather changes,           │
│ inspection priorities change.       │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │   [Rain clouds / photo banner] │ │
│ │   Rainfall scenario: HEAVY     │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ [ DRY ] [ MODERATE ] [ HEAVY ]      │
│  Illustrated input: 65 mm / period   │
│  (NOT A LIVE FORECAST)               │
│                                     │
│  PRIORITY QUEUE — RECALCULATED      │
│ ╭─────────────────────────────────╮ │
│ │ ↑ 01  Outlet A-01               │ │
│ │        Urgent inspection        │ │
│ │        [Explain changes  →]     │ │
│ ╰─────────────────────────────────╯ │
│ ╭─────────────────────────────────╮ │
│ │  02  Swale C-03                 │ │
│ │      Elevated inspection       │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ [ Compare dry vs. heavy scenario ]  │
│                                     │
│ WHY IT CHANGED?                      │
│ Rain context + condition + age ...   │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Scenario change actually re-evaluates engine (not just recolors cards). Keep forecast horizon/units labeled and use **illustrative values only**. Animate card reorder in 250–350 ms with reduced-motion alternative. Provide a pinned explanatory notice that scores are prototype heuristics, not flood likelihood, validated thresholds or weather warnings. Manual reset to reference scenario.

## SCREEN 07 — TwinPulse + Decision X-Ray
**Route:** `/app/cases/:caseId/decision` · **Job:** Explain a recommendation and keep urgency separate from authorization.

```text
┌─────────────────────────────────────┐
│ ← Decision X-Ray         Case #SC-01│
│                                     │
│ Wetland Outlet A-01                 │
│ Review recommendation               │
│                                     │
│ ╭──────────────╮ ╭──────────────╮   │
│ │ STORMWATER   │ │ ECOLOGICAL   │   │
│ │ INSPECTION   │ │ INTERVENTION │   │
│ │ Urgent       │ │ Review       │   │
│ ╰──────────────╯ ╰──────────────╯   │
│                                     │
│ Decision X-Ray                       │
│ ╭─────────────────────────────────╮ │
│ │ + Visual debris flag           │ │
│ │ + Critical outlet             │ │
│ │ + Illustrative heavy rainfall │ │
│ │ + Inspected 21 days ago       │ │
│ │                                 │ │
│ │ Rule set: demo-v1             │ │
│ │ [ Open decision details  ↓ ]  │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ NOT a hydrological risk prediction   │
│ Not an intervention approval         │
│                                     │
│ [ Recommend inspection      → ]      │
│ [ Request ecological review   ]      │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Two separate labeled outputs: `inspectionPriority` and `interventionPermission`. Show factor values and evidence origin (inspector-confirmed / model suggested / scenario simulated). Rule version and limitations always accessible; cannot imply a measured probability. Export/share explanation with scenario label included. Provide empty/error state when insufficient evidence, e.g., `Needs more information`, not forced confidence.

## SCREEN 08 — EcoShield Authorization Review
**Route:** `/app/ecoshield` · **Job:** Prevent unauthorized sensitive works.

```text
┌─────────────────────────────────────┐
│ ← EcoShield            Reviews (01) │
│                                     │
│ Nature needs an approval step.      │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │ WETLAND CELL B-02              │ │
│ │ Proposed: Clear dense plants   │ │
│ │                                 │ │
│ │  ⚠ SPECIALIST REVIEW NEEDED   │ │
│ │  Sensitive habitat / unknowns  │ │
│ │                                 │ │
│ │  Evidence [photo] [notes]      │ │
│ │  Approved guidance: demo rule  │ │
│ │                                 │ │
│ │ [View case] [Request review]   │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ Reviewer notes                     │
│ [_______________________________]   │
│                                     │
│ [Approve]*  [Reject]*              │
│ * Only authorized reviewer          │
│                                     │
│ STATUS: BLOCKED UNTIL AUTHORIZED    │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Must test a denied non-reviewer attempt. Authorized reviewer records identity, decision, timestamp and reason; approvals are specific to a proposed action and evidence set. Modifying the proposed intervention invalidates its previous approval. This **prototype rule set is illustrative**; do not imply statutory authority or SDP endorsement. Backend must enforce approvals in any real multiuser implementation; UI-only gating is demo behavior.

## SCREEN 09 — ProofFrame / Before-After Verification
**Route:** `/app/cases/:caseId/verify` · **Job:** Verify documented work, not self-certify effectiveness.

```text
┌─────────────────────────────────────┐
│ ← ProofFrame             SC-01      │
│                                     │
│ Verify what changed.               │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │   BEFORE  ◄──◉────►  AFTER     │ │
│ │                                 │ │
│ │      DRAGGABLE IMAGE SPLIT      │ │
│ │                                 │ │
│ ╰─────────────────────────────────╯ │
│ Before: sample date, inspector      │
│ After:  sample date, submitted by   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Task completed               │ │
│ │ ? Verification pending         │ │
│ │ ? Functional outcome unknown   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Verification checklist              │
│ [ ] Evidence matches this asset     │
│ [ ] Work order completed            │
│ [ ] Independent review recorded     │
│                                     │
│ [ Record Verification → ]          │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Touch slider supports drag **and** keyboard controls. A completion record must never assert flooding was prevented or ecology improved. Keep original file metadata when feasible. `Verified work completed` is distinct from `Hydraulic performance verified` or `Ecological outcome evaluated`; latter requires field validation beyond MVP.

## SCREEN 10 — SpongeBot / Telegram Hub
**Route:** `/app/telegram` · **Job:** Explain, connect and observe an actual field-to-dashboard pipeline.

```text
┌─────────────────────────────────────┐
│ ← SpongeBot                   ⋯     │
│                                     │
│ Field reporting, wherever           │
│ the team already works.             │
│                                     │
│ ╭─────────────────────────────────╮ │
│ │      [ Telegram logo/icon ]    │ │
│ │       SPONGEBOT                 │ │
│ │       Not connected            │ │
│ │ [ Open bot in Telegram → ]     │ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ How it works                        │
│ ① Send /inspect to SpongeBot        │
│ ② Choose an asset                   │
│ ③ Send a photo + notes              │
│ ④ New case appears in dashboard     │
│                                     │
│ Recent Bot Activity                 │
│ [No messages received yet]          │
│                                     │
│ DEMO MODE: Telegram simulated?      │
│ [See example conversation]          │
│                                     │
│ Secure access & data privacy →      │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Real bot: Telegram `/start` → associate permitted chat/user with role → `/inspect` prompts asset → photo/notes → backend validates Telegram update and creates case with immutable source marker → dashboard real-time refresh or poll → optional manager notification. Surface real connection status; fake conversations explicitly labeled `DEMO EXAMPLE`. Telegram cannot send proactive messages to a user who hasn't started/allowed bot communication. Keep API token and webhook secret server-side. Reject unauthorized chat IDs; deduplicate incoming Telegram update IDs; never let chat button bypass EcoShield. Photos may contain geolocation or sensitive details: obtain consent and restrict storage/access.

## SCREEN 11 — Evidence Ledger / Case History
**Route:** `/app/evidence` and `/app/cases/:caseId` · **Job:** Follow what happened in a verifiable sequence.

```text
┌─────────────────────────────────────┐
│ ← Evidence Ledger          ⌕ Filter│
│                                     │
│ Case #SC-01  · Outlet A-01          │
│ Status: Verification pending        │
│                                     │
│   ● Inspection created             │
│   │  Field inspector • 09:15       │
│   │  [photo] [confirmed notes]     │
│   │                                 │
│   ● Priority evaluated             │
│   │  Rule demo-v1 • scenario heavy │
│   │  [Decision X-Ray →]            │
│   │                                 │
│   ● Review requested               │
│   │  EcoShield gate • 09:25        │
│   │                                 │
│   ● Approval recorded (if any)     │
│   │  Reviewer, reason, version     │
│   │                                 │
│   ○ Completion evidence            │
│   │  Awaiting after-image          │
│   │                                 │
│   ○ Independent verification        │
│                                     │
│ [Open ProofFrame] [Export Case]      │
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** Append-only event semantics (`eventId`, UTC timestamp, actor, event type, source, linked files). Show local time to users but store UTC. Distinguish `source:telegram`, `source:web`, `source:synthetic_seed`. Do not edit old events in place; corrections add another event. Prototype local persistence is acceptable, but do not claim tamper-proof cryptography without actual implementation.

## SCREEN 12 — Reports, Settings and Quality Controls
**Route:** `/app/more` → `/app/reports`, `/app/settings` · **Job:** Review trustworthy KPIs and manage experience.

```text
┌─────────────────────────────────────┐
│ ← More                    ⚙ Settings│
│                                     │
│ Monthly Operations Snapshot         │
│  DEMONSTRATION DATA                 │
│                                     │
│ ╭─────────────╮ ╭────────────────╮  │
│ │ Cases: 07   │ │ Verified: 03   │  │
│ ╰─────────────╯ ╰────────────────╯  │
│ ╭─────────────────────────────────╮ │
│ │ Inspection → Action → Verify    │ │
│ │ [Simple status bar / breakdown]│ │
│ ╰─────────────────────────────────╯ │
│                                     │
│ [ Export evidence report        → ] │
│                                     │
│ Preferences                         │
│  Language: English / Bahasa Melayu  │
│  Appearance: System / Light / Dark  │
│  Motion: System / Reduced           │
│  Demo: Reset synthetic cases        │
│                                     │
│ Sources & image credits            →│
│ Limitations & data provenance      →│
│ Permissions & privacy              →│
│ About this prototype              →│
│─────────────────────────────────────│
│ Home    Assets   ◎Inspect Inbox More│
└─────────────────────────────────────┘
```
**Behaviors:** KPIs use case data, display denominators and time ranges; do not invent flood-prevention outcomes. Settings preserve mobile/desktop preferences. Language switching includes navigation, form labels and warnings (English initially; Malay translation must be checked). Downloadable report includes **demonstration-data notice**, scenario assumptions, timestamps, evidence links, audit log and model status. Provide reset confirmation.

---

# 3. HOW THE TWELVE SCREENS FIT TOGETHER

## Primary journey, shown in five minutes
```text
 WELCOME / DEMO
      │
      ▼
 OPERATIONS CENTER ◄──────────┐
      │                        │
      ▼                        │
 ASSET EXPLORER ─► VISIONSCAN ├──► NEW CASE
                               │       │
 TELEGRAM SPONGEBOT ──────────┘       ▼
                                  STORMSHIFT
                                      │
                                      ▼
                               DECISION X-RAY
                                      │
                               ┌──────┴───────┐
                               ▼              ▼
                          ROUTINE TASK    ECOSHIELD REVIEW
                               │              │
                               └──────┬───────┘
                                      ▼
                                 PROOFFRAME
                                      │
                                      ▼
                               EVIDENCE LEDGER
                                      │
                                      ▼
                                    REPORTS
```

## Case state machine
```text
DRAFT
  └─ submitted → REPORTED
                   └─ field confirmed → INSPECTED
                         ├─ more evidence needed → NEEDS_INFORMATION
                         ├─ routine work → READY_FOR_ASSIGNMENT
                         └─ ecologically sensitive → REVIEW_REQUIRED
                                  ├─ rejected → NEEDS_REVISION
                                  └─ approved → READY_FOR_ASSIGNMENT
READY_FOR_ASSIGNMENT → ASSIGNED → IN_PROGRESS → COMPLETION_SUBMITTED
                                           └→ VERIFIED or RETURNED_FOR_REWORK
```
Authorization records apply to **specific proposed interventions**, not generic assets. A scenario change adjusts **inspection priority** and recommendations, not past approvals or historical observations.

## Information hierarchy rules
- Above the fold on mobile: page title, context/demo status, the ONE most important action, first useful card.
- All screens: a clear back path and a single obvious primary CTA.
- Map-heavy screens: map visible but not dominating the entire first viewport; offer list mode for accessibility.
- Explainability: short summary at card level, expandable full rule detail.
- New inspection: always accessible via center nav and dashboard CTA.
- Notifications and Telegram events: never falsely presented as live when simulated.

---

# 4. DESKTOP ADAPTATION — NOT A STRETCHED PHONE

## Desktop shell, 1440×900 conceptual
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ spongecheck.  │ Search cases/assets...           │ DEMO DATA │ Role ▼ │ Alerts │ Avatar │
├────────────────┬───────────────────────────────────────────────────────────────────────┤
│                │  Operations Center                               New Inspection +    │
│  OVERVIEW      │  ╭────────────╮ ╭────────────╮ ╭────────────╮ ╭────────────╮           │
│  Assets        │  │ 06 Assets  │ │ 03 Flags   │ │ 01 Reviews │ │ 02 Open    │           │
│  VisionScan    │  ╰────────────╯ ╰────────────╯ ╰────────────╯ ╰────────────╯           │
│  StormShift    │                                                                       │
│  Decisions     │  ╭────────────────────────────────────╮ ╭─────────────────────────╮ │
│  EcoShield     │  │           ASSET MAP                │ │  SCENARIO CONTROL       │ │
│  Evidence      │  │    • A-01       • B-02             │ │  Dry / Moderate / Heavy │ │
│  SpongeBot     │  │               • C-03              │ │  Recalculated priority  │ │
│  Reports       │  ╰────────────────────────────────────╯ ╰─────────────────────────╯ │
│  Settings      │                                                                       │
│                │  ╭────────────────────────────────────╮ ╭─────────────────────────╮ │
│  ─────────     │  │      PRIORITY INSPECTION QUEUE    │ │  EVIDENCE ACTIVITY      │ │
│  Help          │  │   [photo] A-01 urgent             │ │  [time] created case    │ │
│  Data sources  │  │   [photo] B-02 eco review         │ │  [time] review request  │ │
│                │  ╰────────────────────────────────────╯ ╰─────────────────────────╯ │
└────────────────┴───────────────────────────────────────────────────────────────────────┘
```

## 12-screen desktop transformations
| Mobile screen | Desktop adaptation |
|---|---|
| 01 Welcome | Cinematic 55/45 split hero, large editorial statement, restrained feature carousel; no app sidebar |
| 02 Access | 50/50 image and form split, centered accessible input card |
| 03 Overview | Sidebar + KPI row + map (2/3) + scenario (1/3) + inspection queue and activity rail |
| 04 Assets | Filter sidebar + full map + persistent details panel; list/map toggle |
| 05 VisionScan | Left image capture and evidence, right structured observations / confirmation; side stepper |
| 06 StormShift | Scenario controls and timeline left, map + sortable inspection queue right |
| 07 Decision X-Ray | Asset evidence left, twin risk panels center, explainability and provenance right |
| 08 EcoShield | Review inbox left and detailed case / approval form right |
| 09 ProofFrame | Large image comparator left, verification form and history right |
| 10 SpongeBot | Setup / status column, sample or live event stream, integration security card |
| 11 Evidence Ledger | Filterable case list left, full-width detailed event timeline on right |
| 12 Reports & Settings | KPI cards, chart area and export panel; settings in categorized side sections |

**Tablet:** Bottom navigation up to 1023 px, 2-column cards, no hover-only controls, side sheets instead of popovers for touch. **Desktop:** persistent sidebar from 1024 px, careful max-width and no giant full-width paragraph lines. **All sizes:** no arbitrary empty spacing or content overflowing cards.

---

# 5. MICROINTERACTIONS + INTRO STORYBOARD

## Signature two-second intro
| Time | Motion | Accessibility behavior |
|---|---|---|
| 0–350 ms | Burgundy-to-ink atmospheric gradient appears | Immediate static background if reduced motion |
| 350–800 ms | Thin waterline / concentric ripple builds the mark | Replace with instant logo |
| 800–1400 ms | `spongecheck.` wordmark and tagline reveal | Direct text display |
| 1400–2100 ms | Logo shifts into nav, hero content fades/staggers | No transition if reduced motion |

Controls: **Skip intro** visible, intro only once per browser session (or opt-in replay), never before a time-sensitive operation, no heavy video/3D blocking initial content. A lightweight CSS/Motion implementation is preferable to giant animation bundles.

## Microanimation rules
| Interaction | Transition | Duration guideline |
|---|---|---|
| Pressing a card | 0–2 px lift or soft scale, visible focus alternative | 140–180 ms |
| Navigating app sections | Fade/translate 8 px, no large page sweeps | 180–260 ms |
| Reordering StormShift priority cards | Shared layout transition | 250–350 ms |
| VisionScan processing | Progress indicator and scan-line **only while actually working** | State-driven |
| Upload complete | Small ripple + confirmation with filename | 200–300 ms |
| EcoShield denied | Inline shake **not required**; clear error copy and explanatory panel | Immediate |
| Approval recorded | Badge transition and audit row insertion | 180–250 ms |
| Bottom sheet | Spring, no overshoot or abrupt jump | ~250 ms |
| Before/after slider | Directly tracks touch; no delayed photo reaction | 1:1 drag |

Avoid fake progress counts or fake analysis animations that imply running models when results are canned. Give status copy such as `Loading saved demonstration observations` when appropriate.

---

# 6. PHOTOGRAPHY AND OPEN IMAGE POLICY

**Use licensed editorial imagery**, particularly for the welcome page, asset category cards, climate-context scenes, and demo inspectable photos. Sources to review:
- Unsplash: https://unsplash.com/license
- Pexels: https://www.pexels.com/license/
- Wikimedia Commons for specific wetland/engineering photographs with compatible license and attribution.

**Asset manifest proposal** (`src/assets/photos/`):
```
hero-storm.webp        -- licensed storm/modern township photo
hero-wetland.webp      -- licensed wetland habitat photo
card-outlet.webp       -- licensed drainage structure image
card-swale.webp        -- licensed planted swale image
card-vegetation.webp   -- licensed reed/wetland vegetation image
sample-before.webp     -- explicitly licensed staged sample
sample-after.webp      -- paired staged sample, same location if genuinely verified
```
For each downloaded file, keep `image-credits.md`: title/description, photographer, URL, license, date checked, edits and intended use. Compress to WebP/AVIF, use responsive `srcset` and lazy-loading, except critical above-the-fold hero. **Never imply stock images are photos of actual Sime Darby assets or of the same before/after location.** If no valid before/after pair exists, use two clearly labeled *illustrative conditions* rather than a falsified comparison.

**Never download images directly from arbitrary Google Images results**, hotlink unknown sources, or include proprietary company logos unless usage is permitted.

---

# 7. TELEGRAM — SPONGEBOT TECHNICAL FLOW

```text
  Inspector on phone
        │  /inspect → selects asset → sends photo/notes
        ▼
  Telegram Bot API (user initiated)
        │  signed/secret-protected update
        ▼
  HTTPS backend webhook
        │  verify header secret, source, update_id, chat allowlist
        ▼
  Attachment ingest + case record + evidence event
        │
        ├─────────► Dashboard queue updates
        │
        └─────────► Manager Telegram message (opt-in / permitted)
                           │
                           ▼
                 Secure web case / review link
```

**Minimum Telegram MVP**: `/start`, `/inspect`, photo+notes, `create case`, acknowledgment with case ID, dashboard-visible case, manager notification to a pre-authorized test chat. `/status <case_id>` only if time permits. Do not implement Telegram role approvals until secure identity binding and server-side authorization are tested. Buttons may open case detail, not approve dangerous maintenance from unchecked chat messages.

**Server requirements:** Telegram token in `.env` and deployed secret store (NEVER `VITE_`), bot webhook secret validation, user/chat allowlist, idempotency by `update_id`, rate limiting, input validation, photo file-size limits and retention handling. Bot privacy copy states photos are sent to Telegram and the SpongeCheck demonstration server. A local simulation fallback must be labeled **Telegram mock demo** and must never show `Connected` if not connected.

**Runtime plan:** Small Node/Express API for Telegram even if the application data otherwise persists in-browser. A hosted database or server-side SQLite may be needed for the bot and UI to share cases. A static frontend alone cannot securely receive Telegram webhook updates. Use polling only if necessary and isolate secrets server-side.

---

# 8. PROTOTYPE DATA, BEHAVIOR AND FEATURE CONTRACT

## Data contracts (illustrative TypeScript)
```ts
type AssetType = 'wetland_outlet' | 'wetland_cell' | 'swale' | 'pond_inlet' | 'detention_pond';
type ScenarioId = 'dry' | 'moderate' | 'heavy';
type EvidenceSource = 'web' | 'telegram' | 'synthetic_seed';
type AnalysisMode = 'real_model' | 'simulated_labels' | 'manual_only';
type Priority = 'routine' | 'elevated' | 'urgent' | 'insufficient_evidence';
type ActionStatus = 'not_proposed' | 'review_required' | 'approved' | 'rejected';

interface Asset {
  id: string; name: string; type: AssetType;
  locationMode: 'synthetic' | 'approved_real';
  geometry?: GeoJSON.Point; sensitivityTags: string[];
  responsibleParty?: string; samplePhotoUrl?: string;
}
interface Observation {
  debris: 'none' | 'visible' | 'uncertain';
  sediment: 'none' | 'visible' | 'uncertain';
  vegetation: 'normal' | 'dense' | 'uncertain';
  inspectorConfirmed: boolean;
  analysisMode: AnalysisMode;
}
interface InspectionCase {
  id: string; assetId: string; observations: Observation;
  reportedAtUtc: string; evidenceIds: string[];
  status: string; source: EvidenceSource; latestRuleVersion: string;
}
interface Recommendation {
  inspectionPriority: Priority;
  interventionStatus: ActionStatus;
  factors: Array<{ label: string; value: string; source: string }>;
  uncertainties: string[]; scenarioId: ScenarioId;
  rulesetId: string; evaluatedAtUtc: string;
}
interface AuditEvent {
  id: string; caseId: string; actorId: string; type: string;
  atUtc: string; source: EvidenceSource; metadata: Record<string, unknown>;
}
```

## Demo priority engine contract
- Inputs: asset type, confirmed visible conditions, inspection recency, criticality and selected synthetic rainfall scenario.
- Output: inspection priority **with explicit factors, ruleset version and uncertainties**.
- Return `insufficient_evidence` if required inputs are unknown; never manufacture a high-confidence answer.
- Independently gate an **intervention** by ecological sensitivity and action type.
- No numeric `floodRiskPercent` or claimed engineering predictions in UI.
- All sample thresholds are illustrative, versioned and replaceable with expert-approved standards for real deployment.

**Acceptance example:** Changing scenario dry → heavy on an asset with confirmed visible obstruction should change priority under the demo rule. An asset with dense wetland vegetation must not automatically receive permission to clear plants regardless of rainfall. New uploaded images must not silently receive cached unrelated labels.

## Verification and reporting
Report measured prototype quantities only: cases created, inspections documented, completion evidence attached, reviews pending, average sandbox workflow time where instrumented. Avoid projected floods averted or proven ecological benefits without field evidence.

---

# 9. EMPTY, LOADING, ERROR, ACCESSIBILITY AND TRUST STATES

| Context | Required state |
|---|---|
| No assets found | Attractive empty state, clear filter reset |
| No inspection photos | Camera/upload placeholder with permissions guidance |
| Camera denied | Manual file picker; no blocking dead end |
| Uploading / analyzing | Accurate progress, timeout, retry, preserve prior selections |
| Real model unavailable | Clear model unavailable state; offer labeled demo mode, do not silently fake results |
| Insufficient evidence | Ask for more inspection details, no misleading forced decision |
| Scenario loading / recalculating | Non-blocking skeleton and `updated at` context |
| Ecological approval blocked | Inline reason, reviewer action route, no dead button |
| No Telegram connection | `Not connected` status, setup guide and openly labeled mock fallback |
| Offline / backend down | Honest connectivity notice, preserve local drafts where feasible |
| Report export | Loading, success with actual file, failure with retry |
| Demo reset | Confirm dialog explaining what will be cleared |

Other requirements: screen-reader labels for icon buttons; visible keyboard focus; semantic headings; input errors associated with fields; `aria-live` only for meaningful notifications; alt text; no reliance on hover; text alternatives for maps/charts; 44 px+ targets; no autoplay audio; reduced motion; number and color never the sole severity signal.

---

# 10. MISSION-CRITICAL BUILD SCOPE FOR 23 OCTOBER

## P0 — Must function end-to-end
1. Polished mobile app shell + working navigation + responsive desktop shell.
2. Six clearly synthetic demo assets, with sample image, details, and Asset Passport.
3. Three-step inspection wizard creating a persistently retrievable case.
4. StormShift scenario engine that **really recomputes** an explainable priority.
5. TwinPulse outputs: separate inspection urgency and ecological approval state.
6. EcoShield gate with recorded human-review decision and invalid-state prevention (backend-secured if remote users are supported).
7. Evidence Ledger tracking every action; ProofFrame supports completion/verification evidence.
8. Official demonstration deck / five-minute video / working prototype link are separate deliverables.

## P1 — Add for judge-facing impact if P0 is stable
9. Real Telegram `/inspect` photo → backend → dashboard integration. If blocked, present a conspicuously labeled local mock and do **not** claim the bot is live.
10. VisionScan tested model inference **or** manual/synthetic image annotations that are expressly labeled.
11. Intro sequence, editorial photography, StormShift layout transitions, beautiful empty/loading states.
12. Exportable evidence report and a simple non-claims-based activity summary.

## P2 — After selection / mentoring stage
Offline sync, sophisticated multiuser auth, operational weather API, automatic image segmentation, crew optimization, analytics beyond demonstrated KPIs, site-specific standards, localized regulatory/engineering review, real township asset integration.

**Feature-cut order if time runs short:** sophisticated charts → advanced map layers → advanced AI overlays → automatic Telegram approvals (never part of hackathon MVP) → fancy intro animation. **Do not cut** case creation, rule transparency, separate ecological approval, audit trail, or the five-minute reproducible demonstration.

---

# 11. TEAM OWNERSHIP AND HANDOFFS

| Member | Owner output by 22 Oct | Key handoff |
|---|---|---|
| **Chit Ko Ko** — Team & Technical Lead | App routes, data persistence, inspection wizard, rules, permissions logic, deploy, Telegram integration if feasible | Give Kyaw stable mobile demo route + screenshots |
| **Nay Paing Oo** — Research & Innovation | Credible evidence for problem, review of competitor overlaps, proposed asset classes, demo observations, rule disclaimers | Give Chit approved draft observations and sources; give Kyaw citations |
| **Kaung Thiha** — Business, Feasibility, Sustainability & Impact | End-user workflow, scenario assumptions, feasibility, pilot resources, honest KPIs and limitations | Give Chit requirements for workflow and reports; give Kyaw impact slide content |
| **Kyaw Zin Win** — UI/UX, Visuals & Submission | Crimson Current design assets, licensed photos and attribution, deck layout, branded intro storyboard, edited 5-min video | Give Chit image manifest and design tokens; test mobile views in build |

**Review gate:** Chit and Kyaw test 390×844 and 1440×900 together; Nay verifies all scientific labels; Kaung checks that presentation impact statements distinguish facts from proposed pilot outcomes.

## Acceptance test matrix
- [ ] On 320/360/390/430 px, no horizontal scrolling, clipped text, or hidden CTA.
- [ ] iPhone Safari, Android Chrome, desktop Chrome/Edge: main journey works.
- [ ] Intro can be skipped; reduced motion fully disables decorative effects.
- [ ] Asset search/map/list all reach same asset detail.
- [ ] Inspector can create a case with an image and confirm observations.
- [ ] Demo-only AI output clearly states `SIMULATED AI RESULT`.
- [ ] Scenario change triggers deterministic recomputation and consistent queue updates.
- [ ] X-Ray accurately shows the **same** rule factors used by priority engine.
- [ ] Sensitive work stays blocked absent required approval; unauthorized actor cannot approve.
- [ ] New evidence or action changes create ledger events with timestamps/source.
- [ ] ProofFrame does not confuse a documented clearance with confirmed flood prevention.
- [ ] Telegram demo is actually live when labeled connected; otherwise clearly mocked.
- [ ] Any export contains data provenance, credits, assumptions and demo disclaimer.
- [ ] Performance: smooth low-end phone experience; hero images optimized; no animation blocking controls.

---

# 12. IMPLEMENTATION HANDOFF — CHATGPT OR CLAUDE CODE

Use the following **when starting implementation in ChatGPT or Claude Code**, with this full blueprint attached:

> You are implementing **SpongeCheck 2.0** for the Sime Darby Property University Hackathon 2026. First inspect and summarize the current repository, identify its existing stack and working features, and propose the shortest safe implementation plan. Do not destroy, overwrite or refactor working code unnecessarily. Treat this complete SpongeCheck blueprint, including the **NON-NEGOTIABLE UX UPDATE**, as the principal frontend and interaction specification. Design for a **390 px phone FIRST** and adapt to desktop. Adopt **Crimson Current** color tokens, premium editorial photographic styling and refined motion. Implement P0 end to end before P1. Every visible control must genuinely work or be intentionally hidden/disabled with a plain-language explanation; perform the clickability audit and end-to-end tests. Use everyday labels and navigation inspired by the clarity of familiar consumer applications. Use clearly labeled synthetic assets and rainfall inputs. Never present canned image annotations as real AI inference. Implement inspection priority and intervention authorization as separate outputs. EcoShield must not allow unauthorized approval; Decision X-Ray must read the actual same rules used by StormShift. Use approved licensed images with source manifest. Telegram needs a secure server-side bot; if no running backend is available, do not pretend it is connected. Follow the screen blueprints, accessibility rules, responsive transforms and test matrix. After each implementation milestone, provide file changes, working route list, test results and honest remaining limitations. Do not generate a static aesthetic mockup in place of the functional application. Keep 23 October 2026, 11:59 PM MYT first-stage submission readiness as the controlling constraint.

## DONE MEANS
The reviewer can open the mobile web app, view a coherent premium landing experience, inspect a real interactive sample workflow, see scenario-dependent explanations, attempt and fail an unauthorized eco-sensitive intervention, inspect the evidence history, and see accurate labels for all demo assumptions—with the exact same app working on desktop.

---

**Design principle:** *Make the complex understandable, the important visible, and every intervention accountable.*
