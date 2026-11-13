#!/usr/bin/env bash
# Runs the browser tests against the built app (index.html) on http://localhost:8099.
#   tests/run.sh            every test in tests/e2e
#   tests/run.sh fresh nav  just those
# A test fails when it prints a line with FAIL, exits with an error or takes longer than 5 minutes.
# Screenshots and other output go to tests/e2e/out (not committed). JOBS sets how many run at once (default 6);
# SHARD=i/n runs one part of the suite. tests/e2e/durations.txt (name and seconds) orders them: update it when a test's
# time changes a lot (the runner prints each test's time).
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD E2E=$PWD/tests/e2e OUT=$PWD/tests/e2e/out
mkdir -p "$OUT"/{bt,ed,nav,shots}
if ! curl -s -o /dev/null http://localhost:8099/index.html; then
  (setsid nohup python3 -m http.server 8099 --directory "$ROOT" >/dev/null 2>&1 &)
  for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:8099/index.html && break; sleep 0.5; done
fi
if [ $# -gt 0 ]; then T="$*"; else T=$(cd "$E2E" && ls *.cjs | grep -v '^seed' | sed 's/\.cjs$//'); fi
# Longest first, from the times in tests/e2e/durations.txt (a test not listed counts as 30 s): a long test that starts
# last runs on its own at the end.
DUR=$E2E/durations.txt
T=$(printf '%s\n' $T | awk -v f="$DUR" 'BEGIN{while((getline l < f)>0){split(l,a," ");d[a[1]]=a[2]}} {print (($0 in d)?d[$0]:30), $0}' | sort -k1,1nr -k2,2 | awk '{print $2}')
# SHARD=i/n runs one part of the suite (CI splits it across machines this way): each test, longest first, goes to the
# machine with the least to do so far, so the machines finish at about the same time.
if [ -n "${SHARD:-}" ]; then i=${SHARD%/*}; n=${SHARD#*/}; T=$(printf '%s\n' $T | awk -v i="$i" -v n="$n" -v f="$DUR" 'BEGIN{while((getline l < f)>0){split(l,a," ");d[a[1]]=a[2]}} {t=($0 in d)?d[$0]:30;b=1;for(k=2;k<=n;k++)if(L[k]<L[b])b=k;L[b]+=t;if(b==i)print}'); fi
one() {
  t=$1; f=$E2E/$t.cjs
  [ -f "$f" ] || { echo "MISSING $t"; return; }
  s0=$SECONDS; out=$(cd "$OUT" && timeout 300 node "$f" 2>&1); code=$?; dt=$((SECONDS-s0))
  n=$(printf '%s\n' "$out" | grep -c FAIL)
  if [ "$code" != 0 ] || [ "$n" != 0 ]; then
    echo "FAILED $t (exit $code, $n FAIL lines, ${dt}s)"; printf '%s\n' "$out" | grep -m8 -E 'FAIL|Error|rror:' | sed 's/^/    /'
  else printf 'ok     %-14s %4ss\n' "$t" "$dt"; fi
}
export -f one; export E2E OUT
# Tests that time things (pauses on screen, freezes) run one at a time after the rest, on a quiet machine: run
# alongside others they measure the other tests' load as much as the app.
TIMED="cardwork pdfwork stress"
par=$(printf '%s\n' $T | grep -vxF -f <(printf '%s\n' $TIMED) || true)
ser=$(printf '%s\n' $T | grep -xF -f <(printf '%s\n' $TIMED) || true)
res=$( { [ -n "$par" ] && printf '%s\n' $par | xargs -P "${JOBS:-6}" -I{} bash -c 'one {}'; [ -n "$ser" ] && printf '%s\n' $ser | xargs -P 1 -I{} bash -c 'one {}'; } )
printf '%s\n' "$res" | sort
bad=$(printf '%s\n' "$res" | grep -cE '^(FAILED|MISSING)')
echo "$(printf '%s\n' $T | wc -l) tests, $bad failed"
[ "$bad" = 0 ]
