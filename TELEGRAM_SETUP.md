# SpongeCheck Phase 6 — SpongeBot setup

This project includes a functional **server-side Telegram Bot API adapter and HTTPS webhook endpoint**, plus a read-only Telegram-case inbox in the existing React UI. The provided build is **not connected to a real Telegram bot** until a maintainer supplies credentials and deploys the API. The local example conversation is labeled as a simulation.

## Prerequisites
- Node.js 20+ (Node 22 recommended). No npm packages required by the backend.
- A new bot created using Telegram's `@BotFather`, with a bot token and bot username.
- An HTTPS-accessible Node server hosting `server/start.mjs` (a static Vite host alone cannot receive webhooks).
- An authorized Telegram test user ID; optional manager test chat ID. Ask testers' permission before using their photos; avoid sensitive, identifiable photographs.

## Configure
1. Copy `.env.example` to `.env` in the project root and **never commit `.env`**. Generate two separate long random secrets, e.g. using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `SPONGECHECK_DASHBOARD_KEY`, `TELEGRAM_ALLOWED_USER_IDS` (comma-separated Telegram **numeric user IDs**, not phone numbers), and `TELEGRAM_MANAGER_CHAT_ID` if notifications are desired.
3. Set `SPONGECHECK_ALLOWED_ORIGIN=http://localhost:5173` for local browser development or your **exact deployed frontend origin**. Configure `SPONGECHECK_DATA_FILE` on a persistent private disk, **outside the static web root**. Static serverless functions without persistent storage are not suitable for the supplied JSON store.
4. Locally start backend using `node --env-file=.env server/start.mjs` (default port 8787). Start frontend with `npm install && npm run dev`; Vite forwards `/api` to port 8787. When deploying frontend on a separate host, enter the backend HTTPS origin in the SpongeBot UI. The API CORS allowlist must be that frontend's origin.
5. Set `TELEGRAM_WEBHOOK_URL=https://YOUR_API_HOST/webhooks/telegram`, ensure this reaches your Node backend, and run `node --env-file=.env server/configure-webhook.mjs`. This registers the webhook URL and secret with Telegram without echoing the token.
6. In Telegram: send `/start` → `/inspect` → `/asset A-01` → send a photo with optional caption → receive a case ID. `/status SC-TG-...` returns status only for the original chat user. Your sample manager chat receives a short alert only if its chat is configured and has previously opened the bot.
7. In SpongeCheck go to **Telegram updates**, enter a backend address only if separate, paste the **dashboard access key** (held in this tab's memory, never in Vite env or localStorage), then select **Load Telegram reports**. The case and photo appear in a separate **read-only** backend inbox. Check the home card and My reports cross-link.

## Security and truthfulness
- The webhook requires Telegram's `X-Telegram-Bot-Api-Secret-Token` and a private-chat allowlist. `update_id` is deduplicated; updates are persisted atomically. The photo is fetched from Telegram's `getFile` response with size and JPEG-content checks, then stored in private JSON. Protect your server filesystem and regularly delete unnecessary data.
- The management API requires a separate dashboard bearer key, and cross-origin access is limited to the exact allowed frontend origin. This is **a limited-access hackathon demo**, not a production multiuser auth or sensitive-data management platform; do not expose the dashboard access key to the public.
- Browser-created practice cases stay in local browser storage; Telegram-origin cases stay in the server store and appear **read-only**. A Telegram photo has **not** been inspected by a human or by AI, and no live maintenance approval is possible from Telegram.
- Bot API responses (including `sendMessage`) can fail: a case can be stored even if Telegram acknowledgment/manager notification fails. The current demo does not implement an outbox/retry queue for such notifications.
- Telegram hosting, webhook registration and end-to-end receipt from Telegram **have not been performed in this workspace**. Test with actual credentials and an authorized chat before a real demonstration. Never record tokens or private keys on video.

## Endpoint guide
- `GET /api/telegram/status` public configuration status (not credentials). `connected` means a permitted inbound update was received, not a guarantee Telegram is currently reachable.
- `GET /api/telegram/cases` authorized read-only case list (including demo photo data). Use `Authorization: Bearer <dashboard key>`.
- `POST /webhooks/telegram` inbound Telegram updates only, secret-header protected.
- Other endpoints return 404; there is **no public endpoint to fabricate Telegram cases** or approve ecological work.

## Acceptance tests
- `node tests/phase6_spongebot_test.mjs` runs a mock Telegram API: bot commands, photo intake, persistence, authentication, CORS and deduplication. No real Telegram traffic.
- `python tests/phase6_ui_test.py` tests the actual Phase 6 React preview with a mocked HTTPS API: connection state, bad key, inbox, case details, home widget, disconnect, and responsive sizes.
- **Production Vite build** still needs validation with npm dependencies available: `npm install && npm run build`.

Official API reference: https://core.telegram.org/bots/api
