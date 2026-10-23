# Real photography refresh QA

- 11 distinct real Pexels images mapped into main interface (6 unique assets and 5 additional placements).
- Previous locally illustrated assets removed from shipped public assets and offline preview.
- Pexels source links, photographers and license recorded in image-credits.md and free-photo-manifest.json.
- Full image bytes could not be downloaded within this execution environment because external binary downloads are blocked. Application initially loads photos by their Pexels image URLs; for a reliable demo on your PC run `npm run photos:download`. Only then are the images locally bundled.
- Offline preview bundle compiles and UI smoke test passes at 320/360/390/430 px.
- Decision engine 13 tests passed; case workflow guards 20+ assertions passed; 155 JSX buttons with handlers in static audit.
- Source photo mapping verified unique for all 11 placements.
- Real network image loads and Vite npm build NOT verified here.
- Telegram remains configurable but not live without user credentials/hosting.
