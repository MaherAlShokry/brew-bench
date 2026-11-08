#!/usr/bin/env python3
"""Make the Android home-screen icons: every app logo in every vibe, light and dark.

Usage: python3 tools/gen-app-icons.py

The logos come from src/data/logos.json (and the bean from the top bar's markup, drawn here); the colours from each
vibe's light and dark palette in src/app.js (VIBES). For each logo × vibe × mode it writes, under android/app/src/main/res:
  drawable/ic_logo_<key>.xml               the logo as a vector, centred in the 108dp adaptive-icon canvas
  mipmap-anydpi-v26/ic_launcher_<key>.xml  the adaptive icon (Android 8 and up; also a monochrome layer)
  mipmap/ic_launcher_<key>.xml             a round-cornered icon for Android 7
  values/ic_logos.xml                      each palette's background colour
It also rewrites the <activity-alias> block in AndroidManifest.xml (between the icons:start and icons:end markers)
and IconNames.java, the list AppIconPlugin switches between.

The Roastery light icons keep their original names (the bean keeps the original launcher icon), so the icon a phone
shows now stays valid across the update.
"""
import json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
res = root / 'android' / 'app' / 'src' / 'main' / 'res'
manifest = root / 'android' / 'app' / 'src' / 'main' / 'AndroidManifest.xml'
java = root / 'android' / 'app' / 'src' / 'main' / 'java' / 'io' / 'github' / 'maheralshokry' / 'brewbench' / 'IconNames.java'
logos = {k: v for k, v in json.loads((root / 'src' / 'data' / 'logos.json').read_text()).items() if k != '_'}
vibes = json.loads(re.search(r'const VIBES=(\[.*?\]);\n', (root / 'src' / 'app.js').read_text()).group(1))
LOGO_KEYS = ['bean'] + list(logos)
MODES = {'l': 3, 'd': 4}  # light and dark palettes in each VIBES entry
SCALE, OFF = 2.25, 27     # the 24-unit logo drawn 2.25x into the 108dp canvas, inside the 66dp area every mask keeps

def key_of(logo, vibe, mode):
    return logo if (vibe == 'roastery' and mode == 'l') else f'{logo}_{vibe}_{mode}'

def alias_of(logo, vibe, mode):
    return '.Icon' + logo.capitalize() + ('' if (vibe == 'roastery' and mode == 'l') else f'_{vibe}_{mode}')

def path(p):
    if 'c' in p:
        x, y, r = p['c']
        return f'M{x - r},{y}a{r},{r} 0 1,0 {2 * r},0a{r},{r} 0 1,0 {-2 * r},0z'
    return p['d']

def paint(p, col):
    a = p.get('op', 1)
    if 'fill' in p:
        return f'android:fillColor="{col[p["fill"]]}" android:fillAlpha="{a}"'
    return (f'android:fillColor="#00000000" android:strokeColor="{col[p["stroke"]]}" android:strokeAlpha="{a}" '
            f'android:strokeWidth="{p["w"]}" android:strokeLineCap="round" android:strokeLineJoin="round"')

def vector(logo, col):
    head = ('<?xml version="1.0" encoding="utf-8"?>\n<!-- Made by tools/gen-app-icons.py: edit src/data/logos.json or the vibes, not this. -->\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" '
            'android:viewportWidth="108" android:viewportHeight="108">\n')
    if logo == 'bean':
        # The top bar's bean: a 352-unit viewBox from 80, turned -38° about its centre, clipped to the bean's ellipse.
        s = 54 / 352
        body = (f'    <group android:translateX="{OFF}" android:translateY="{OFF}"><group android:scaleX="{s:.5f}" android:scaleY="{s:.5f}">'
                '<group android:translateX="-80" android:translateY="-80"><group android:rotation="-38" android:pivotX="256" android:pivotY="256">\n'
                '        <clip-path android:pathData="M136,256a120,166 0 1,0 240,0a120,166 0 1,0 -240,0z"/>\n'
                f'        <path android:fillColor="{col["cherry"]}" android:pathData="M100,80h320v360h-320z"/>\n'
                f'        <path android:fillColor="{col["honey"]}" android:pathData="M262 80c-50 50 50 126 0 176s50 126 0 184H440V80z"/>\n'
                f'        <path android:fillColor="#00000000" android:strokeColor="{col["paper"]}" android:strokeWidth="22" '
                'android:pathData="M262 80c-50 50 50 126 0 176s50 126 0 184"/>\n'
                '    </group></group></group></group>\n')
    else:
        parts = '\n'.join(f'        <path {paint(p, col)} android:pathData="{path(p)}"/>' for p in logos[logo]['parts'])
        body = (f'    <group android:translateX="{OFF}" android:translateY="{OFF}" android:scaleX="{SCALE}" android:scaleY="{SCALE}">\n'
                f'{parts}\n    </group>\n')
    return head + body + '</vector>\n'

colors, aliases, names = [], [], []
for v in vibes:
    vibe = v[0]
    for mode, idx in MODES.items():
        pal = v[idx]
        col = {k: pal[k] for k in ('cherry', 'honey', 'leaf', 'paper')}
        if vibe == 'pure':  # Pure stays black and white: the logos' gold and green turn grey, as in the app
            col['honey'] = col['leaf'] = '#8E8E96'
        bg = f'ic_bg_{vibe}_{mode}'
        colors.append(f'    <color name="{bg}">{pal["paper"]}</color>')
        for logo in LOGO_KEYS:
            k = key_of(logo, vibe, mode)
            names.append(f'{logo}:{vibe}:{mode}')
            if k == 'bean':  # the original launcher icon stays as it is
                aliases.append((alias_of(logo, vibe, mode), '@mipmap/ic_launcher', '@mipmap/ic_launcher_round', True))
                continue
            (res / 'drawable' / f'ic_logo_{k}.xml').write_text(vector(logo, col))
            (res / 'mipmap-anydpi-v26').mkdir(exist_ok=True)
            (res / 'mipmap-anydpi-v26' / f'ic_launcher_{k}.xml').write_text(
                '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                f'    <background android:drawable="@color/{bg}"/>\n'
                f'    <foreground android:drawable="@drawable/ic_logo_{k}"/>\n'
                f'    <monochrome android:drawable="@drawable/ic_logo_{k}"/>\n</adaptive-icon>\n')
            (res / 'mipmap').mkdir(exist_ok=True)
            (res / 'mipmap' / f'ic_launcher_{k}.xml').write_text(
                '<?xml version="1.0" encoding="utf-8"?>\n<layer-list xmlns:android="http://schemas.android.com/apk/res/android">\n'
                f'    <item><shape android:shape="rectangle"><corners android:radius="22dp"/><solid android:color="@color/{bg}"/>'
                '<size android:width="108dp" android:height="108dp"/></shape></item>\n'
                f'    <item android:drawable="@drawable/ic_logo_{k}"/>\n</layer-list>\n')
            aliases.append((alias_of(logo, vibe, mode), f'@mipmap/ic_launcher_{k}', f'@mipmap/ic_launcher_{k}', False))
# The old single background colour stays defined for anything that still names it.
(res / 'values' / 'ic_logos.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    '    <color name="ic_logo_background">#FBF7F0</color>\n' + '\n'.join(colors) + '\n</resources>\n')
# Old per-logo files from before vibes, with the same names as the Roastery light ones, are simply overwritten above.

m = manifest.read_text()
block = '\n'.join(f'        <activity-alias android:name="{a}" android:targetActivity=".MainActivity" android:enabled="{"true" if on else "false"}" '
                  f'android:exported="true" android:icon="{ic}" android:roundIcon="{rd}" android:label="@string/app_name"><intent-filter>'
                  '<action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity-alias>'
                  for a, ic, rd, on in aliases)
if '<!-- icons:start -->' not in m:
    # First run: replace the hand-listed aliases with the marked, generated block.
    m = re.sub(r'(\s*<activity-alias android:name="\.Icon[^"]*".*?</activity-alias>)+', '\n        <!-- icons:start -->\n<<ICONS>>\n        <!-- icons:end -->', m, count=1, flags=re.S)
m = re.sub(r'<!-- icons:start -->.*?<!-- icons:end -->', '<!-- icons:start -->\n' + block.replace('\\', '\\\\') + '\n        <!-- icons:end -->', m.replace('<<ICONS>>', ''), flags=re.S)
manifest.write_text(m)

java.write_text('package io.github.maheralshokry.brewbench;\n\n'
    '// Made by tools/gen-app-icons.py: every home-screen icon as "logo:vibe:mode" and its activity-alias.\n'
    'final class IconNames {\n    private IconNames() {}\n'
    '    static final String[] KEYS = {' + ', '.join(f'"{n}"' for n in names) + '};\n'
    '    static final String[] ALIASES = {' + ', '.join(f'"{alias_of(*n.split(":"))}"' for n in names) + '};\n}\n')
print(f'{len(LOGO_KEYS)} logos x {len(vibes)} vibes x 2 modes = {len(names)} icons')
