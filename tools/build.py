#!/usr/bin/env python3
"""Build index.html from src/.  Usage: python3 tools/build.py [--artifact]
--artifact  builds the single-file version for claude.ai (no manifest or service worker)."""
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
page = (src / 'template.html').read_text(encoding='utf-8')
data = (src / 'data' / 'origins-varieties-history.js').read_text(encoding='utf-8') + '\n' + (src / 'data' / 'brewing.js').read_text(encoding='utf-8')
out = page.replace('__MAP__', (src / 'data' / 'world-map.json').read_text(encoding='utf-8')) \
          .replace('__DATA__', data).replace('__APP__', (src / 'app.js').read_text(encoding='utf-8'))
if '--artifact' not in sys.argv:
    pwa = ('<link rel="manifest" href="manifest.webmanifest">\n'
           '<script>if("serviceWorker" in navigator){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n')
    out = out.replace('</head>', pwa + '</head>', 1)
    out = out.replace('rel="apple-touch-icon" href="data:', 'rel="apple-touch-icon-legacy" href="data:', 1)
    out = out.replace('</head>', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n</head>', 1)
target = root / ('dist/brew-bench-artifact.html' if '--artifact' in sys.argv else 'index.html')
target.parent.mkdir(exist_ok=True)
target.write_text(out, encoding='utf-8')
print(f'Built {target.relative_to(root)} ({len(out)//1024} KB)')
