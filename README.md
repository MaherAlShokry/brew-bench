# ☕ The Brew Bench

A coffee field guide and dial-in tool that works like an app on your phone. Set your grinder, brewer and water and see roughly what lands in the cup before you pour. It also has recipes, a brew timer, and a guide to where coffee grows and where each variety came from.

**Live site:** `https://<your-username>.github.io/brew-bench/` (after you enable GitHub Pages, see below)

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

1. Open the live site on your phone.
2. **iPhone (Safari):** tap Share, then **Add to Home Screen**. **Android (Chrome):** tap ⋮, then **Install app** or **Add to Home screen**.

It opens full-screen like a native app and works offline after the first visit.

## Publish it with GitHub Pages

1. Push this repository to GitHub (see *Getting it onto GitHub* below).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push any change to `main` (or run the workflow from the **Actions** tab). The site builds and deploys automatically.

## Project structure

```
brew-bench/
├── index.html                  Built site (generated; don't edit by hand)
├── manifest.webmanifest        App name, colours and icons for "Add to Home Screen"
├── sw.js                       Service worker for offline use
├── icons/                      App icons
├── src/
│   ├── template.html           Page layout and all styles
│   ├── app.js                  All interactive logic
│   └── data/
│       ├── origins-varieties-history.js   Origins, varieties, family tree, timeline
│       ├── brewing.js                     Brewers, recipes, processes, techniques, quiz
│       └── world-map.json                 Pre-projected map geometry
├── tools/
│   ├── build.py                Assembles src/ into index.html
│   └── gen-map.mjs             Regenerates world-map.json from Natural Earth data
├── .github/workflows/pages.yml Build and deploy to GitHub Pages
└── dist/                       Artifact build output (git-ignored)
```

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

## Getting it onto GitHub

**Option A, no command line:** create a new empty repository on github.com named `brew-bench`, click **uploading an existing file**, and drag in everything from this folder, including the hidden `.github` folder.

**Option B, with git:**

```bash
cd brew-bench
git remote add origin https://github.com/<your-username>/brew-bench.git
git push -u origin main
```

## Notes on accuracy

The cup-profile estimator is a model built from brewing rules of thumb, not a measurement. Recipes credited to named people follow their published methods; recipes marked "classic" or "in the style of" are general techniques. History and variety facts were checked against sources, but some coffee history is legend, and those items are labelled as such. Corrections are welcome as issues or pull requests.

## Credits

- Map geometry: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas), projected with [d3-geo](https://github.com/d3/d3-geo)
- PDF export: [jsPDF](https://github.com/parallax/jsPDF) (MIT)
- Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) and [Literata](https://fonts.google.com/specimen/Literata) (SIL Open Font License)

## Licence

MIT. See [LICENSE](LICENSE).
