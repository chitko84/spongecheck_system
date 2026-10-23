# SpongeCheck 2.0 — Deployment and activation

**Release type:** hackathon demonstration prototype, NOT a production maintenance platform. **Last local review:** 23 October 2026 (MYT).

## 1. Verify actual production compilation first (currently blocked in the isolated workspace)

On a computer with Node.js 20+ and npm internet access, in the extracted project directory:

```bash
npm install
npm run typecheck
npm run build
npm run preview
```

Only claim a successful Vite production build after these commands exit successfully. Confirm the app is reachable at the preview address, use browser devtools for JavaScript errors, and open the nested route `/app/rain` **directly**. Build output belongs in `dist/`. **Do not** deploy the separate legacy React UMD/offline preview as the public React 18 production app; it exists solely as a downloadable offline test artifact.

## 2. Frontend hosting

Choose a static Vite host: Vercel, Netlify or another host with HTTPS and history fallback.

- GitHub repo root = folder containing `package.json`.
- Build command = `npm run build`; publish directory = `dist`.
- `vercel.json` and `public/_redirects` are included to serve `/app/*`, `/sign-in`, `/demo` and `/about` without a 404 on refresh (choose the configuration for your host).
- Verify **mobile 390 × 844**, small mobile **320 px**, desktop **1440 px**; complete one entire practice report flow and one report export from the real deployed production build.
- Do not add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, or `SPONGECHECK_DASHBOARD_KEY` to Vite client variables or the frontend host.

## 3. Telegram backend: optional, separate deployment

The provided Node backend `server/start.mjs` uses *private on-disk JSON storage*. It **must** run on a persistent filesystem. Disposable serverless instances (including ordinary frontend Vercel functions) are **not compatible** with that storage design; records may disappear or diverge.

- Deploy the Node 20+ process on a persistent Node server with a stable public **HTTPS** URL; a VPS or managed service with a persistent disk is suitable. Infrastructure may carry cost.
- Set the **server-only** variables from `.env.example`. Use distinct, cryptographically random secrets and a specific Telegram test-user allowlist.
- Set `SPONGECHECK_DATA_FILE` to a non-public writable persistent path. Keep the private JSON data outside the static web root, restrict host access and define a cleanup policy.
- Set `SPONGECHECK_ALLOWED_ORIGIN` to the exact public frontend origin (scheme + host; no trailing slash).
- Start with `node --env-file=.env server/start.mjs`, or configure equivalent variables in the host's secret store.
- Check `GET https://YOUR_API_HOST/api/telegram/status`. The status page is public but does not disclose secrets. "Configured" is not proof that a real Telegram message arrived.
- Set `TELEGRAM_WEBHOOK_URL=https://YOUR_API_HOST/webhooks/telegram` and run `node --env-file=.env server/configure-webhook.mjs` to register Telegram's secret-bearing webhook.
- With an allowlisted Telegram account send `/start`, `/inspect`, `/asset A-01`, then an example photograph. Confirm a unique new case in the bot reply and the authorized dashboard. Test `/status SC-TG-...`.
- In the app's **Telegram updates** screen, enter the HTTPS backend address and dashboard key. Do **not** share that key in a video or screenshots.
- The Telegram list remains **read-only** because demo-role switching is NOT identity verification. Do not bypass this restriction.

If these steps cannot be completed, show the app's clearly labeled **example conversation** instead. Never imply a real Telegram connection.

## 4. Security / data limitations that remain

- Browser practice reports are saved in the browser, not a multi-user server database. Changing computer/browser does not synchronize them.
- Demo user roles are selectable personas, not authenticated identities. Demo approvals are **not** safe/legal authorization for actual site work.
- No live weather API, calibrated hydraulic thresholds, field-site validation or trained image vision model is connected. Synthetic scenarios and labeled example findings must be described as **demonstrations**.
- Reports document recorded actions and example evidence only; they do not verify reductions in flooding or environmental impact.
- The Telegram backend has a webhook secret, user allowlist, update-ID deduplication, CORS checks and a separate dashboard key. It does **not** provide per-user access control, a durable notification retry queue, automated deletion, photo-virus scanning or production observability; do not process confidential or personal images.

## 5. Actual release acceptance gate

Mark the *deployment* complete only when: (1) `npm run build` succeeds; (2) nested URLs refresh successfully over HTTPS; (3) camera/file upload and report export succeed on iOS Safari or Android Chrome; (4) scenario changes and approval workflow work in the production build; (5) all privacy/demo notices are visible; (6) if Telegram is called live, actual inbound Telegram traffic creates a backend case; (7) one reviewer independently completes the 5-minute walkthrough; (8) submissions links can be opened from a private/incognito browser.
