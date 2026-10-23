# Real photography replacement — SpongeCheck 2.0

The previously reused digitally illustrated landscapes have been removed from the application. **Eleven different Pexels free-use stock photographs** now occupy the hero, editorial section, feature card, access screen, inspection sidebar and six unique sample-place cards. All are actual photographs, not generated images.

## Recommended: bundle all real photos locally on your Windows PC

In the extracted project directory:

```powershell
npm run photos:download
npm install
npm run dev
```

The first command downloads all eleven selected images, validates their JPEG contents, saves them under `public/assets/photos/`, and automatically updates the React source to use local files. You can run it again if the first attempt fails. The downloader updates the source code only after **all eleven images** are successfully downloaded.

If you have already run `npm install`, simply use `npm run photos:download` followed by `npm run dev`. It uses built-in Node.js features, so no extra packages are needed.

**If you skip the image-download command:** React still attempts to load the genuine Pexels photographs from their original HTTPS image URLs. If your internet or image host is inaccessible, you may see a neutral empty color area instead of a photo, never the old illustrations. For a reliable public demo, download first and deploy the resulting `public/assets/photos/` directory.

## Verify

After the download:

- Confirm `public/assets/photos/` contains 11 `.jpg` files.
- Open the homepage; all hero, editorial, onboarding, feature and sample-place slots should display distinct photographic scenes.
- Check `src/App.tsx` has references to `/assets/photos/`.
- Run `npm run build` to verify the production bundle, and test the site in your browser.
- If you need an offline standalone HTML demo, run `npm run build:offline` and repackage the preview; offline previews need image data inlined to display images without internet.

## Licenses, origins and appropriate use

Full image list and credit metadata are in `free-photo-manifest.json` and `image-credits.md`. All are sourced from Pexels, whose license permits free use and modification in websites/apps: https://www.pexels.com/license/ . The photos show unrelated real-world locations, **not the fictitious SpongeCheck demo township or actual Sime Darby Property assets**. They do not prove flood prevention, inspections or completed maintenance. Never label stock editorial photos as user-submitted field evidence. Example image labels remain explicit.
