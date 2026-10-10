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
| **Dial-in** | Grind, temperature, ratio, bloom (20 s to 3 min), agitation, roast, process and variety in, estimated cup profile out, with concrete fixes ("try ZP6 Special 5.3") |
| **Brew planner** | Pick brewer, grinder, technique and coffee; get an adapted recipe with the reasoning behind every setting |
| **Scan beans** | Photograph a bag's label: the text is read on your phone (offline) and matched to origins, varieties, processes and roast date for a full brew plan. The coffee's name and roastery are picked up too (and can be edited): the roastery is found wherever it sits on the bag, from a known roaster's name, "Roasted by …", a logo line or the web address, so each roaster gets credit on the scan. Labels in English, Spanish and Portuguese are understood, small misreads are corrected, and a photo taken sideways or upside down is turned the right way. Take a photo with the in-app camera, or choose one from your photos |
| **Gear and dials** | A library of 36 manual and electric grinders, grouped by type and brand, (1Zpresso ZP6, K-Ultra, K-Max, J-Max, J-Ultra, JX, JX-Pro, X-Pro, X-Ultra, Q2; Comandante C40, Red Clix and X25; Timemore C2, C3, C3S Pro, S3, C3 ESP Pro, C5 Pro, C5 ESP Pro; Kingrinder K0, K1, K2, K4, K6; Hario; Porlex; Fellow Ode and Opus; Baratza; Breville; OXO; Wilfa; Niche; DF64; Mahlkönig EK43) with burrs, dials and typical settings. Every grinder sits on one shared grind scale, so you can match a setting from any grinder to any other (for example ZP6 5.4 = K-Ultra 7.7), and recipes and the dial-in keep the same grind when you switch grinders. Pick the grinders you own, add your own, compare them side by side. Plus 29 brewers (including the CAFEC Deep 27 and Flower Dripper, Hario MUGEN and Bee House) and a grind map. Calibrating a brewer (how fine you like it) moves all your grinders on that brewer together, and the Match tool compares the grinders themselves, so recipes and matches always agree |
| **Recipes** | 93 recipes, 21 of them from world champions, each credited, with settings for your grinders and a step-by-step brew timer (progress ring, the next pour and its target weight, a soft beep before each step, and one tap to log the brew when you finish). Create your own (or save the dial-in as one) and share them by link or live with your team. Quick links (Surprise me, your recipes, favorites), a Brew again row, cup types (pour-over, immersion, AeroPress, espresso-like, iced and cold, championships), search, and a heart to save favorites |
| **Techniques** | 36 techniques from swirl blooms to turbo shots |
| **Processes** | 29 processes from washed to thermal shock, plotted on a clean-to-wild map |
| **Origins map** | 50 coffee origins on an interactive, colour-coded world map |
| **Varieties** | 44 varieties with stories, Geisha types and side-by-side comparison |
| **History** | A clickable variety family tree, a timeline, key people and a quiz |
| **World championships** | Every World Brewers Cup, World AeroPress and World Barista champion on a timeline with a live countdown to the next final, filters by championship and brewer, and a recipe sheet for every champion: their coffee, gear and published recipe (or a marked starting point in the same style), adapted to the brewers and grinders you own |
| **From seed to cup** | A tappable flow diagram of how coffee is made, from nursery to cup in 16 steps across farm, mill, trade, roastery and kitchen; the processing step branches into five paths that open into a tree of all 29 processes (Anaerobic opens to anaerobic natural, carbonic maceration and lactic; starter cultures to yeast, koji and mossto), with ageing and decaf as optional steps; every process links to its full explanation |
| **Coffee words** | A searchable bank of 111 coffee terms in six topics (plant and farm, processing, green coffee and trade, roasting, brewing, tasting), each linked to the processes, varieties and sections behind it |
| **Flavour wheel** | The coffee tasting wheel drawn in the app’s own design: 121 notes in 9 families, built on the SCA and World Coffee Research wheel with more speciality notes so every group has notes of its own. Tap a family to spin it open, tap a note to read what it tastes like, which processes and varieties bring it and which of your brews had it, and add it to your next brew. Search any note, and download the wheel as a poster image |
| **Guide** | Ratio calculator and a taste-based troubleshooter |
| **Log** | Rated brew log with stats and CSV export, shared live with friends through a group code. Note what you tasted on the flavour wheel (light, medium or strong): each brew keeps a profile wheel you can open and download as an image, and “Your palate” sums up the notes across all your brews |

You can share anything to WhatsApp, Telegram, Messages or email, through your phone's share menu, as a styled PDF, or as text. Every share carries a link that opens the same thing in the app: a recipe, a champion's recipe, your dial-in or brew plan (with the grind converted to the other person's grinders), a variety or an origin. Everything you save (calibration, log, scans) stays in your own browser.

## Install on your phone

**Android app (APK):** open the [latest APK](https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk) on your phone and tap it to install. The first time, Android asks you to allow installs from your browser or file manager. A new APK is built and published on the [Releases](https://github.com/MaherAlShokry/brew-bench/releases) page every time `main` changes. In the app, sheets and menus slide up and away, screens slide the way you are going, and the phone's back gesture closes the open sheet or steps back a screen, and only leaves the app from the Brew home.

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
