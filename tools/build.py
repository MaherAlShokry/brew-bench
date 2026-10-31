#!/usr/bin/env python3
"""Build the site from src/.

Usage: python3 tools/build.py [--artifact | --app] [--site DIR] [--site-url URL]
       python3 tools/build.py --moved DIR

  (no flags)   builds index.html (the website, with manifest and service worker)
  --artifact   builds dist/brew-bench-artifact.html, a single file for claude.ai
               (no manifest or service worker)
  --app        builds for the Android app: no service worker, since the app
               already ships every file inside the APK
  --site DIR   also copies everything the site needs into DIR, ready to deploy
               (used by the website deploy and the Android build)
  --site-url   the address links and share cards point to, instead of the
               Firebase Hosting one (used until Firebase Hosting is set up)
  --moved DIR  builds the old GitHub Pages address after the move: a page that
               forwards to the new address and carries saved data across, plus
               the files older apps and the Play listing still fetch there
"""
import json, sys, shutil, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
args = sys.argv[1:]
artifact, app = '--artifact' in args, '--app' in args
site = pathlib.Path(args[args.index('--site') + 1]).resolve() if '--site' in args else None
# The website's address. Old apps and the Play listing still use the old one, which keeps serving these files.
NEW_URL, OLD_URL = 'https://brew-bench.web.app/', 'https://maheralshokry.github.io/brew-bench/'
site_url = args[args.index('--site-url') + 1] if '--site-url' in args else NEW_URL
assert site_url.startswith('https://') and site_url.endswith('/'), '--site-url must be https://… ending in /'
host = lambda u: u.split('://', 1)[1].rstrip('/')
def address(text, url=None):
    url = url or site_url
    return text.replace(NEW_URL, url).replace(host(NEW_URL), host(url))

if '--moved' in args:
    moved = pathlib.Path(args[args.index('--moved') + 1]).resolve()
    if moved.exists():
        shutil.rmtree(moved)
    moved.mkdir(parents=True)
    page = (src / 'moved.html').read_text(encoding='utf-8').replace('__NEWHOST__', host(NEW_URL)).replace('__NEW__', NEW_URL)
    (moved / 'index.html').write_text(page, encoding='utf-8')
    shutil.copy(src / 'moved-sw.js', moved / 'sw.js')
    shutil.copytree(root / 'icons', moved / 'icons')
    shutil.copy(root / 'events.json', moved / 'events.json')
    for name in ('privacy.html', 'delete-account.html'):
        (moved / name).write_text((root / name).read_text(encoding='utf-8'), encoding='utf-8')
    print(f'Built the moved page in {moved.relative_to(root) if moved.is_relative_to(root) else moved}')
    sys.exit(0)

# Files served next to index.html. Keep in sync with the SHELL list in sw.js.
SITE_FILES = ['manifest.webmanifest', 'sw.js', 'icons', 'vendor', 'events.json', 'privacy.html', 'delete-account.html']
GOOGLE_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Noto+Color+Emoji&display=swap" rel="stylesheet">'
JSPDF_CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>'

page = (src / 'template.html').read_text(encoding='utf-8')
assert GOOGLE_FONTS in page and JSPDF_CDN in page, 'font or jsPDF tag in template.html changed; update build.py'
data = (src / 'data' / 'origins-varieties-history.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'brewing.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'championships.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'knowledge.js').read_text(encoding='utf-8') + '\nconst EVENTS_DEFAULT=' + (root / 'events.json').read_text(encoding='utf-8') + ';' + '\nconst LOGO_DATA=' + (src / 'data' / 'logos.json').read_text(encoding='utf-8') + ';'
out = page.replace('__MAP__', (src / 'data' / 'world-map.json').read_text(encoding='utf-8').replace('</', '<\\/')) \
          .replace('__SPLASH_LOGOS__', json.dumps({k: v for k, v in json.loads((src / 'data' / 'logos.json').read_text(encoding='utf-8')).items() if k != '_'}, separators=(',', ':'))).replace('__DATA__', data).replace('__APP__', (src / 'wheel.js').read_text(encoding='utf-8') + '\n' + (src / 'steps.js').read_text(encoding='utf-8') + '\n' + (src / 'app.js').read_text(encoding='utf-8') + '\n' + (src / 'beans.js').read_text(encoding='utf-8') + '\n' + (src / 'brewcard.js').read_text(encoding='utf-8') + '\n' + (src / 'select.js').read_text(encoding='utf-8') + '\n' + (src / 'profile.js').read_text(encoding='utf-8') + '\n' + (src / 'sync.js').read_text(encoding='utf-8'))
if not artifact:
    # The website and app use the bundled copies in vendor/ so they work offline.
    # Only the flag emoji font still comes from Google (Windows lacks flag emoji).
    out = out.replace(GOOGLE_FONTS, '<link href="vendor/fonts.css" rel="stylesheet">\n'
                      + ('' if app else '<link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">'), 1)
    out = out.replace(JSPDF_CDN, '<script>const JSPDF_SRC="vendor/jspdf.umd.min.js"</script>', 1)
    pwa = '<link rel="manifest" href="manifest.webmanifest">\n'
    if not app:
        pwa += '<script>if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n'
    if app:
        # The Android app knows its own version, to offer newer ones (see APP UPDATES in app.js).
        import os, re
        v = os.environ.get('VERSION_NAME', '')
        if re.fullmatch(r'\d+(\.\d+)*', v):
            pwa += '<script>const APP_VERSION="' + v + '"</script>\n'
    out = out.replace('</head>', pwa + '</head>', 1)
    out = out.replace('rel="apple-touch-icon" href="data:', 'rel="apple-touch-icon-legacy" href="data:', 1)
    out = out.replace('</head>', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n</head>', 1)

if artifact:
    # The PDF engine loads when it's first needed (see loadPDF in app.js).
    out = out.replace(JSPDF_CDN, '<script>const JSPDF_SRC="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"</script>', 1)
    target = root / 'dist' / 'brew-bench-artifact.html'
elif app:
    target = root / 'dist' / 'app' / 'index.html'
else:
    target = root / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(address(out), encoding='utf-8')
print(f'Built {target.relative_to(root)} ({len(out)//1024} KB) for {site_url}')

if site:
    if site.exists():
        shutil.rmtree(site)
    site.mkdir(parents=True)
    shutil.copy(target, site / 'index.html')
    for name in SITE_FILES:
        if app and name == 'sw.js':
            continue
        p = root / name
        if p.suffix == '.html':
            (site / name).write_text(address(p.read_text(encoding='utf-8')), encoding='utf-8')
        else:
            (shutil.copytree if p.is_dir() else shutil.copy)(p, site / name)
    print(f'Copied site to {site.relative_to(root) if site.is_relative_to(root) else site}')
