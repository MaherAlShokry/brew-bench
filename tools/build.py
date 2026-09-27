#!/usr/bin/env python3
"""Build the site from src/.

Usage: python3 tools/build.py [--artifact | --app] [--site DIR]

  (no flags)   builds index.html (the website, with manifest and service worker)
  --artifact   builds dist/brew-bench-artifact.html, a single file for claude.ai
               (no manifest or service worker)
  --app        builds for the Android app: no service worker, since the app
               already ships every file inside the APK
  --site DIR   also copies everything the site needs into DIR, ready to deploy
               (used by GitHub Pages and the Android build)
"""
import sys, shutil, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
args = sys.argv[1:]
artifact, app = '--artifact' in args, '--app' in args
site = pathlib.Path(args[args.index('--site') + 1]).resolve() if '--site' in args else None

# Files served next to index.html. Keep in sync with the SHELL list in sw.js.
SITE_FILES = ['manifest.webmanifest', 'sw.js', 'icons', 'vendor', 'events.json']
GOOGLE_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Noto+Color+Emoji&display=swap" rel="stylesheet">'
JSPDF_CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>'

page = (src / 'template.html').read_text(encoding='utf-8')
assert GOOGLE_FONTS in page and JSPDF_CDN in page, 'font or jsPDF tag in template.html changed; update build.py'
data = (src / 'data' / 'origins-varieties-history.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'brewing.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'championships.js').read_text(encoding='utf-8') + '\nconst EVENTS_DEFAULT=' + (root / 'events.json').read_text(encoding='utf-8') + ';'
out = page.replace('__MAP__', (src / 'data' / 'world-map.json').read_text(encoding='utf-8')) \
          .replace('__DATA__', data).replace('__APP__', (src / 'app.js').read_text(encoding='utf-8'))
if not artifact:
    # The website and app use the bundled copies in vendor/ so they work offline.
    # Only the flag emoji font still comes from Google (Windows lacks flag emoji).
    out = out.replace(GOOGLE_FONTS, '<link href="vendor/fonts.css" rel="stylesheet">\n'
                      + ('' if app else '<link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">'), 1)
    out = out.replace(JSPDF_CDN, '<script src="vendor/jspdf.umd.min.js" defer></script>', 1)
    pwa = '<link rel="manifest" href="manifest.webmanifest">\n'
    if not app:
        pwa += '<script>if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n'
    out = out.replace('</head>', pwa + '</head>', 1)
    out = out.replace('rel="apple-touch-icon" href="data:', 'rel="apple-touch-icon-legacy" href="data:', 1)
    out = out.replace('</head>', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n</head>', 1)

if artifact:
    target = root / 'dist' / 'brew-bench-artifact.html'
elif app:
    target = root / 'dist' / 'app' / 'index.html'
else:
    target = root / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(out, encoding='utf-8')
print(f'Built {target.relative_to(root)} ({len(out)//1024} KB)')

if site:
    if site.exists():
        shutil.rmtree(site)
    site.mkdir(parents=True)
    shutil.copy(target, site / 'index.html')
    for name in SITE_FILES:
        if app and name == 'sw.js':
            continue
        p = root / name
        (shutil.copytree if p.is_dir() else shutil.copy)(p, site / name)
    print(f'Copied site to {site.relative_to(root) if site.is_relative_to(root) else site}')
