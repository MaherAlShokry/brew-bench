#!/usr/bin/env python3
"""Make the Android home-screen icons for the app logos in src/data/logos.json.

Usage: python3 tools/gen-app-icons.py

For each logo (the bean keeps the original icon) it writes, under android/app/src/main/res:
  drawable/ic_logo_<key>.xml            the logo as a vector, centred in the 108dp adaptive-icon canvas
  mipmap-anydpi-v26/ic_launcher_<key>.xml  the adaptive icon (Android 8 and up; also a monochrome layer)
  mipmap/ic_launcher_<key>.xml          a round-cornered icon for Android 7
and prints the <activity-alias> entries for AndroidManifest.xml. Run it again after changing a logo.
"""
import json, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
res = root / 'android' / 'app' / 'src' / 'main' / 'res'
logos = {k: v for k, v in json.loads((root / 'src' / 'data' / 'logos.json').read_text()).items() if k != '_'}
# The house colours (the Roastery vibe, light), since a home-screen icon can't follow the app's look.
COL = {'cherry': '#8A5A3B', 'honey': '#C9964A', 'leaf': '#6B8E4E', 'paper': '#FBF7F0'}
BG = '#FBF7F0'
# The 24-unit logo is drawn 2.25x into the 108dp canvas, inside the 66dp area every launcher's mask keeps.
SCALE, OFF = 2.25, 27

def path(p):
    if 'c' in p:
        x, y, r = p['c']
        return f'M{x - r},{y}a{r},{r} 0 1,0 {2 * r},0a{r},{r} 0 1,0 {-2 * r},0z'
    return p['d']

def paint(p):
    a = p.get('op', 1)
    if 'fill' in p:
        return f'android:fillColor="{COL[p["fill"]]}" android:fillAlpha="{a}"'
    return (f'android:fillColor="#00000000" android:strokeColor="{COL[p["stroke"]]}" android:strokeAlpha="{a}" '
            f'android:strokeWidth="{p["w"]}" android:strokeLineCap="round" android:strokeLineJoin="round"')

for key, logo in logos.items():
    body = '\n'.join(f'        <path {paint(p)} android:pathData="{path(p)}"/>' for p in logo['parts'])
    (res / 'drawable' / f'ic_logo_{key}.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<!-- Made by tools/gen-app-icons.py from src/data/logos.json: edit that, not this. -->\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" '
        'android:viewportWidth="108" android:viewportHeight="108">\n'
        f'    <group android:translateX="{OFF}" android:translateY="{OFF}" android:scaleX="{SCALE}" android:scaleY="{SCALE}">\n'
        f'{body}\n    </group>\n</vector>\n')
    (res / 'mipmap-anydpi-v26').mkdir(exist_ok=True)
    (res / 'mipmap-anydpi-v26' / f'ic_launcher_{key}.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_logo_background"/>\n'
        f'    <foreground android:drawable="@drawable/ic_logo_{key}"/>\n'
        f'    <monochrome android:drawable="@drawable/ic_logo_{key}"/>\n</adaptive-icon>\n')
    (res / 'mipmap').mkdir(exist_ok=True)
    (res / 'mipmap' / f'ic_launcher_{key}.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<layer-list xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <item><shape android:shape="rectangle"><corners android:radius="22dp"/><solid android:color="@color/ic_logo_background"/>'
        '<size android:width="108dp" android:height="108dp"/></shape></item>\n'
        f'    <item android:drawable="@drawable/ic_logo_{key}"/>\n</layer-list>\n')
(res / 'values' / 'ic_logos.xml').write_text(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_logo_background">{BG}</color>\n</resources>\n')

print('Made icons for', ', '.join(logos))
print('\nActivity aliases for AndroidManifest.xml:')
for key, logo in logos.items():
    print(f'        <activity-alias android:name=".Icon{key.capitalize()}" android:targetActivity=".MainActivity" android:enabled="false" '
          f'android:exported="true" android:icon="@mipmap/ic_launcher_{key}" android:roundIcon="@mipmap/ic_launcher_{key}" android:label="@string/app_name">'
          '<intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity-alias>')
