#!/usr/bin/env bash
# Runs the browser tests against the built app (index.html) on http://localhost:8099.
#   tests/run.sh            every test in tests/e2e
#   tests/run.sh fresh nav  just those
# A test fails when it prints a line with FAIL, exits with an error or takes longer than 5 minutes.
# Screenshots and other output go to tests/e2e/out (not committed). JOBS sets how many run at once (default 4).
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD E2E=$PWD/tests/e2e OUT=$PWD/tests/e2e/out
mkdir -p "$OUT"/{bt,ed,nav,shots}
if ! curl -s -o /dev/null http://localhost:8099/index.html; then
  (setsid nohup python3 -m http.server 8099 --directory "$ROOT" >/dev/null 2>&1 &)
  for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:8099/index.html && break; sleep 0.5; done
fi
if [ $# -gt 0 ]; then T="$*"; else T=$(cd "$E2E" && ls *.cjs | grep -v '^seed' | sed 's/\.cjs$//'); fi
one() {
  t=$1; f=$E2E/$t.cjs
  [ -f "$f" ] || { echo "MISSING $t"; return; }
  out=$(cd "$OUT" && timeout 300 node "$f" 2>&1); code=$?
  n=$(printf '%s\n' "$out" | grep -c FAIL)
  if [ "$code" != 0 ] || [ "$n" != 0 ]; then
    echo "FAILED $t (exit $code, $n FAIL lines)"; printf '%s\n' "$out" | grep -m8 -E 'FAIL|Error|rror:' | sed 's/^/    /'
  else echo "ok     $t"; fi
}
export -f one; export E2E OUT
res=$(printf '%s\n' $T | xargs -P "${JOBS:-4}" -I{} bash -c 'one {}')
printf '%s\n' "$res" | sort
bad=$(printf '%s\n' "$res" | grep -cE '^(FAILED|MISSING)')
echo "$(printf '%s\n' $T | wc -l) tests, $bad failed"
[ "$bad" = 0 ]
