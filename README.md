# ☕ The Brew Bench

A coffee field guide and dial-in tool that works like an app on your phone. Set your grinder, brewer and water and see roughly what lands in the cup before you pour. It also has recipes, a brew timer, and a guide to where coffee grows and where each variety came from.

**Live site:** https://maheralshokry.github.io/brew-bench/ (share this link with anyone)  
**Android app:** [download brew-bench.apk](https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk)

## Features

| Section | What it does |
| --- | --- |
| **Dial-in** | Grind, temperature, ratio, bloom, agitation, roast, process and variety in, estimated cup profile out, with concrete fixes ("try ZP6 Special 5.3") |
| **Brew planner** | Pick brewer, grinder, technique and coffee; get an adapted recipe with the reasoning behind every setting |
| **Scan beans** | Fill in a bag's details (or, in the Claude-hosted version, photograph the label) for a full brew plan |
| **Gear and dials** | 1Zpresso ZP6 Special and K-Ultra specs with live dials, 25 brewers, and a grind map showing where each brewer sits |
| **Recipes** | 45 recipes, each credited, with settings for both grinders and a step-by-step brew timer |
| **Techniques** | 36 techniques from swirl blooms to turbo shots |
| **Processes** | 29 processes from washed to thermal shock, plotted on a clean-to-wild map |
| **Origins map** | 50 coffee origins on an interactive, colour-coded world map |
| **Varieties** | 44 varieties with stories, Geisha types and side-by-side comparison |
| **History** | A clickable variety family tree, a timeline, key people and a quiz |
| **Guide** | Ratio calculator and a taste-based troubleshooter |
| **Log** | Rated brew log with stats and CSV export |

You can share anything as a styled PDF, send it to other apps, or copy it as text. Everything you save (calibration, log, scans) stays in your own browser.

## Install on your phone

**Android app (APK):** open the [latest APK](https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk) on your phone and tap it to install. The first time, Android asks you to allow installs from your browser or file manager. A new APK is built and published on the [Releases](https://github.com/MaherAlShokry/brew-bench/releases) page every time `main` changes.

**Straight from the website:** open the live site, then:
- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap ⋮, then **Install app** or **Add to Home screen**.

It opens full-screen like a native app and works offline after the first visit.

## Publishing

Two GitHub Actions workflows run on every push to `main`:

| Workflow | What it does |
| --- | --- |
| `pages.yml` | Builds the site and deploys it to GitHub Pages |
| `android.yml` | Builds the APK and attaches it to a new release (on other branches it only builds, as a check) |

**One-time setup for the website:** in the repository, go to **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**. Then re-run the workflow from the **Actions** tab (or push any change).

**Optional: a permanent signing key for the APK.** Without one, CI signs each APK with a throwaway debug key, so installing a newer version may ask you to uninstall the old one first. To sign every build with the same key, create one on your computer:

```bash
keytool -genkeypair -keystore brewbench.keystore -alias brewbench -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 brewbench.keystore   # macOS: base64 -i brewbench.keystore
```

Then add four secrets under **Settings → Secrets and variables → Actions**: `BB_KEYSTORE_BASE64` (the base64 output), `BB_KEYSTORE_PASSWORD`, `BB_KEY_ALIAS` (`brewbench`) and `BB_KEY_PASSWORD`. Keep the keystore file somewhere safe and never commit it.

## Project structure

```
brew-bench/
├── index.html                  Built site (generated; don't edit by hand)
├── manifest.webmanifest        App name, colours and icons for "Add to Home Screen"
├── sw.js                       Service worker for offline use
├── icons/                      Website icons
├── src/                        Source for the site (edit these)
│   ├── template.html           Page layout and all styles
│   ├── app.js                  All interactive logic
│   └── data/
│       ├── origins-varieties-history.js   Origins, varieties, family tree, timeline
│       ├── brewing.js                     Brewers, recipes, processes, techniques, quiz
│       └── world-map.json                 Pre-projected map geometry
├── tools/
│   ├── build.py                Assembles src/ into index.html (and the app/site folders)
│   └── gen-map.mjs             Regenerates world-map.json from Natural Earth data
├── android/                    Android app project (Capacitor), wraps the site in an APK
├── assets/icon-only.png        Source image for the Android launcher icons
├── capacitor.config.json       App id, name and web folder for the Android app
└── .github/workflows/
    ├── pages.yml               Build and deploy the website to GitHub Pages
    └── android.yml             Build the APK and publish it as a release
```

Build output (`dist/`, `_site/`, `www/`) is git-ignored.

## Editing

Most changes are data edits. Add a recipe to `RECIPES` in `src/data/brewing.js`, or an origin to `O` in `src/data/origins-varieties-history.js`. Then rebuild:

```bash
python3 tools/build.py          # builds index.html
python3 -m http.server 8080     # preview at http://localhost:8080
```

Adding a new origin country to the map also needs its ISO numeric code added in `tools/gen-map.mjs`, then:

```bash
npm install
node tools/gen-map.mjs
```

`python3 tools/build.py --artifact` builds a single-file version (without the manifest or service worker) for hosting as a Claude artifact.

To build the Android app yourself you need Node 22, JDK 21 and the Android SDK (Android Studio installs it):

```bash
npm install
npm run build:app                    # builds www/ and copies it into android/
cd android && ./gradlew assembleDebug   # APK lands in android/app/build/outputs/apk/debug/
```

`npm run icons` regenerates the launcher icons from `assets/icon-only.png`.

## Notes on accuracy

The cup-profile estimator is a model built from brewing rules of thumb, not a measurement. Recipes credited to named people follow their published methods; recipes marked "classic" or "in the style of" are general techniques. History and variety facts were checked against sources, but some coffee history is legend, and those items are labelled as such. Corrections are welcome as issues or pull requests.

## Credits

- Map geometry: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas), projected with [d3-geo](https://github.com/d3/d3-geo)
- PDF export: [jsPDF](https://github.com/parallax/jsPDF) (MIT)
- Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) and [Literata](https://fonts.google.com/specimen/Literata) (SIL Open Font License)

## Licence

MIT. See [LICENSE](LICENSE).
