#!/usr/bin/env python3
"""Folds the times of a test run into a durations file (the one tests/run.sh orders and splits the tests by).

    python3 tools/timings.py DURATIONS TIMINGS...

DURATIONS is updated in place. Each TIMINGS file is what tests/run.sh writes to tests/e2e/out/timings.txt: a test's
name and its seconds, one per line. A test's new time is the mean of its old time and this run's, so one slow run on a
busy machine doesn't reorder everything. Tests that no longer exist drop out; tests that didn't run keep their time.
CI does this after every run (see .github/workflows/tests.yml), so the order stays current without anyone editing the
file. Run it on a local run's timings to update tests/e2e/durations.txt in the repository.
"""
import pathlib
import sys


def read(p):
    d = {}
    try:
        for line in pathlib.Path(p).read_text(encoding='utf-8').splitlines():
            a = line.split()
            if len(a) == 2 and a[1].isdigit():
                d[a[0]] = int(a[1])
    except FileNotFoundError:
        pass
    return d


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    dur = pathlib.Path(sys.argv[1])
    old, new = read(dur), {}
    for f in sys.argv[2:]:
        new.update(read(f))
    tests = {p.stem for p in (pathlib.Path(__file__).resolve().parent.parent / 'tests' / 'e2e').glob('*.cjs') if not p.stem.startswith('seed')}
    out = {}
    for t in sorted(tests):
        if t in new:
            out[t] = max(1, round((old[t] + new[t]) / 2)) if t in old else max(1, new[t])
        elif t in old:
            out[t] = old[t]
    dur.write_text(''.join(f'{t} {s}\n' for t, s in sorted(out.items(), key=lambda x: (-x[1], x[0]))), encoding='utf-8')
    print(f'{dur}: {len(out)} tests, {len(new)} timed in this run')


main()
