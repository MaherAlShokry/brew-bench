# ☕ The Brew Bench

A coffee field guide and dial-in tool that works like an app on your phone. Set your grinder, brewer and water and see roughly what lands in the cup before you pour. It also has recipes, a brew timer, and a guide to where coffee grows and where each variety came from.

## Links

| | |
| --- | --- |
| 🌐 **Website** (share this with friends) | https://maheralshokry.github.io/brew-bench/ |
| 📱 **Android app** (APK download) | https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk |

Both update automatically whenever `main` changes.

## Features

| Section | What it does |
| --- | --- |
| **Dial-in** | Grind, temperature, ratio, bloom, agitation, roast, process and variety in, estimated cup profile out, with concrete fixes ("try ZP6 Special 5.3") |
| **Brew planner** | Pick brewer, grinder, technique and coffee; get an adapted recipe with the reasoning behind every setting |
| **Scan beans** | Photograph a bag's label: the text is read on your phone (offline) and matched to origins, varieties, processes and roast date for a full brew plan |
| **Gear and dials** | A library of 30 manual and electric grinders (1Zpresso ZP6, K-Ultra, K-Max, J-Max, J-Ultra, JX, JX-Pro, X-Pro, X-Ultra, Q2; Comandante C40 and Red Clix; Timemore C2, C3, C3 ESP Pro; Kingrinder K4, K6; Hario; Porlex; Fellow Ode and Opus; Baratza; Breville; OXO; Wilfa; Niche; DF64; Mahlkönig EK43) with burrs, dials and typical settings. Every grinder sits on one shared grind scale, so you can match a setting from any grinder to any other (for example ZP6 5.4 = K-Ultra 7.0), and recipes and the dial-in keep the same grind when you switch grinders. Pick the grinders you own, add your own, compare them side by side. Plus 25 brewers and a grind map |
| **Recipes** | 59 recipes, each credited, with settings for your grinders and a step-by-step brew timer. Create your own (or save the dial-in as one) and share them by link or live with your team |
| **Techniques** | 36 techniques from swirl blooms to turbo shots |
| **Processes** | 29 processes from washed to thermal shock, plotted on a clean-to-wild map |
| **Origins map** | 50 coffee origins on an interactive, colour-coded world map |
| **Varieties** | 44 varieties with stories, Geisha types and side-by-side comparison |
| **History** | A clickable variety family tree, a timeline, key people and a quiz |
| **Guide** | Ratio calculator and a taste-based troubleshooter |
| **Log** | Rated brew log with stats and CSV export, shared live with friends through a group code |

You can share anything to WhatsApp, Telegram, Messages or email, through your phone's share menu, as a styled PDF, or as text. Everything you save (calibration, log, scans) stays in your own browser.

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
| `pages.yml` | Builds the site and publishes it to the `gh-pages` branch, which GitHub Pages serves |
| `android.yml` | Builds the APK and attaches it to a new release (on other branches it only builds, as a check) |

GitHub Pages is set to serve the `gh-pages` branch (**Settings → Pages**). Don't edit that branch by hand; it's rebuilt on every deploy.

**Optional: a permanent signing key for the APK.** Without one, CI signs each APK with a throwaway debug key, so installing a newer version may ask you to uninstall the old one first. To sign every build with the same key, create one on your computer:

```bash
keytool -genkeypair -keystore brewbench.keystore -alias brewbench -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 brewbench.keystore   # macOS: base64 -i brewbench.keystore
```

Then add four secrets under **Settings → Secrets and variables → Actions**: `BB_KEYSTORE_BASE64` (the base64 output), `BB_KEYSTORE_PASSWORD`, `BB_KEY_ALIAS` (`brewbench`) and `BB_KEY_PASSWORD`. Keep the keystore file somewhere safe and never commit it.

## Shared brew log (Firebase)

Friends can log brews and share recipes together: each person joins the same shared log (a code like `ABCD-2345`, or an invite link) and everyone's entries and recipes appear live on everyone's phone, with the name of whoever added them. Entries made offline sync when the phone reconnects.

The log is stored in a free [Firebase Realtime Database](https://firebase.google.com/docs/database). One-time setup:

1. Go to the [Firebase console](https://console.firebase.google.com/), click **Create a project** (Google Analytics can be off).
2. In the project, open **Build → Realtime Database → Create database**, pick a location, and start in **locked mode**.
3. Open the **Rules** tab, replace the rules with the ones below, and click **Publish**.
4. Copy the database URL shown at the top (like `https://your-project-default-rtdb.firebaseio.com`) and put it in `FIREBASE_DB_URL` near the top of the shared-log section of `src/app.js`, then push.

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "groups": {
      "$code": {
        ".read": "$code.matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)",
        "log": {
          "$id": {
            ".write": "$code.matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)",
            ".validate": "newData.hasChildren(['id', 'ts'])"
          }
        },
        "recipes": {
          "$id": {
            ".write": "$code.matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)",
            ".validate": "newData.hasChildren(['id', 'name', 'b'])"
          }
        }
      }
    }
  }
}
```

The rules stop anyone from listing groups; a group can only be read or written by someone who has its code (about a trillion possible codes). Anyone you give the code or invite link to can read, add and delete entries, so share it only with the people you brew with.

## Project structure

```
brew-bench/
├── index.html                  Built site (generated; don't edit by hand)
├── manifest.webmanifest        App name, colours and icons for "Add to Home Screen"
├── sw.js                       Service worker for offline use
├── icons/                      Website icons (rendered from assets/logo.svg)
├── vendor/                     Bundled font (Inter), jsPDF and the label reader (ocr/), so the site and app work offline
├── src/                        Source for the site (edit these)
│   ├── template.html           Page layout and all styles
│   ├── app.js                  All interactive logic
│   └── data/
│       ├── origins-varieties-history.js   Origins, varieties, family tree, timeline
│       ├── brewing.js                     Brewers, recipes, processes, techniques, quiz
│       └── world-map.json                 Pre-projected map geometry
├── tools/
│   ├── build.py                Assembles src/ into index.html (and the app/site folders)
│   ├── vendor.mjs              Refreshes vendor/ from node_modules
│   └── gen-map.mjs             Regenerates world-map.json from Natural Earth data
├── android/                    Android app project (Capacitor), wraps the site in an APK
├── assets/                     Logo (logo.svg) and the images the Android icons and splash screens are made from
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

`npm run icons` regenerates the Android launcher icons and splash screens from the PNGs in `assets/`, and `npm run vendor` refreshes the bundled font, jsPDF and label reader in `vendor/`.

The logo, a two-tone coffee bean split by its S-shaped crease, is drawn in `assets/logo.svg`. `assets/logo-light.svg` is the bean for light backgrounds, `assets/logo-foreground.svg` is the mark without its background, and `assets/logo-maskable.svg` has extra padding for rounded icon masks.

## Notes on accuracy

The cup-profile estimator is a model built from brewing rules of thumb, not a measurement. Recipes credited to named people follow their published methods; recipes marked "classic" or "in the style of" are general techniques. History and variety facts were checked against sources, but some coffee history is legend, and those items are labelled as such. Corrections are welcome as issues or pull requests.

## Credits

- Map geometry: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas), projected with [d3-geo](https://github.com/d3/d3-geo)
- PDF export: [jsPDF](https://github.com/parallax/jsPDF) (MIT), bundled in `vendor/`
- Label reading: [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0), bundled in `vendor/ocr/`
- Fonts: San Francisco (the system font) on Apple devices; [Inter](https://rsms.me/inter/) everywhere else (SIL Open Font License), bundled in `vendor/` via [Fontsource](https://fontsource.org/)

## Licence

MIT. See [LICENSE](LICENSE).
