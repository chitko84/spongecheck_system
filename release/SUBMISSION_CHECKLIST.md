# Sime Darby Property University Hackathon 2026 — Submission gate

**Target:** First-stage proposal, **23 October 2026 at 11:59 PM MYT**, as shown in the participant briefing supplied during this project. Independently reconfirm any portal-specific cutoff or organizer update. This package is a software release candidate; **no submission has been made**.

## Organizer deliverables to prepare

- [ ] **Pitch deck** — maximum 10 main slides under the supplied participant brief; appendix if allowed. Use the organizer's official template. Cover problem, target user, solution, innovation, how it works, impact, feasibility and implementation. Any existing SpongeCheck slide deck is a *draft*, not automatically the final submission deck.
- [ ] **Five-minute demonstration video OR accepted live-demo link** — verify exactly which format the portal permits; provide playback without sign-in. This source archive contains a run-of-show but is **not** a recorded demo video.
- [ ] **Working prototype link** — public HTTPS URL, with a demo entry path. Test in incognito and on mobile without a developer's browser storage.
- [ ] **Prototype/codebase/GitHub link** — push the verified final React source; include a useful README and no secrets. Do not upload `.env`, Telegram tokens or test personal photos.
- [ ] **Optional supporting documentation** — validated problem sources, competitor-positioning caution, pilot feasibility, test/limitations summary.
- [ ] Team details and preferred track **PLANET**, consistent with official submission fields.

## Product evidence gate

- [ ] Production build (`npm install`, `npm run typecheck`, `npm run build`) passes on a machine with dependencies.
- [ ] Functional demo screens are online, including deep-link refresh for `/app/*`.
- [ ] Show actual saved-case decisions and real file exports rather than mocked download toasts.
- [ ] Sample data, sample photos, rules, reviews and rainfall clearly labeled.
- [ ] Screens look good at 320–430px and at desktop width; no clipped footer/nav/CTA.
- [ ] The Telegram screen is explicitly marked unconnected if no live bot. If live is claimed, test the genuine HTTPS webhook end-to-end.
- [ ] No broken images, hidden buttons, blank pages, console errors, mystery jargon, personal information or confidential tokens.
- [ ] A teammate can perform the entire video journey independently.
- [ ] Every uploaded link opens without private credentials; ZIP repository contains a GitHub-ready package.
- [ ] Submit before the deadline; save a timestamped receipt or confirmation screenshot.

## Claim discipline

Explain only what was actually demonstrated: inspection data collection, illustrative rule-based prioritization, human-review workflows, photo documentation, and Telegram backend functionality tested with a mock API. **Do not claim actual flood risk reductions, accurate hydrological forecasting, deployed wetlands, real AI image analysis, or verified ecological outcomes.**

## Outstanding external tasks (not possible from this isolated release job)

1. Install React/Vite dependencies and verify a real production build.
2. Create a hosted live frontend and test the public link.
3. Deploy a persistent Telegram backend and connect private credentials only if a live bot demo is required.
4. Finalize the official pitch deck, record/edit the five-minute video and submit through the actual hackathon portal.
