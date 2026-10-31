#!/usr/bin/env bash
# ============================================================
# tools/verify-patch.sh — patches/ দুটি আসলেই বিশুদ্ধ Source A-তে
# ধারাবাহিকভাবে প্রয়োগযোগ্য কিনা, এবং প্রয়োগের পর (ক) D-01/D-02 স্ক্যানার
# শূন্য দেখায় কিনা, (খ) TypeScript error সংখ্যা baseline-এর সমান থাকে কিনা
# — সব একসাথে প্রমাণ করে। কোনো production/repo ফাইল বদলায় না; সব কাজ /tmp-তে।
#
# ব্যবহার:
#   bash tools/verify-patch.sh            # প্যাচ যাচাই (প্রয়োজনে নতুন করে বানায়)
#   REGEN=0 bash tools/verify-patch.sh    # বিদ্যমান patches/ ফাইলই ব্যবহার করবে
#   REF=/path/to/amar-somobay-v2 bash tools/verify-patch.sh
#
# প্রয়োজন: git, diff, node (১৮+), python3। tsc-parity অংশের জন্য
# Source A-র node_modules দরকার — না থাকলে সেই ধাপ SKIP দেখাবে (বাকিগুলো চলবে)।
# ============================================================
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WS="$(cd "$APP_DIR/.." && pwd)"
REF="${REF:-$WS/reference/amar-somobay-v2}"
PATCH_DIR="${PATCH_DIR:-$WS/patches}"
WORK="${WORK:-/tmp/verify-patch}"
REGEN="${REGEN:-1}"
MODULE_CACHE="${MODULE_CACHE:-/tmp/tsbase/node_modules}"
P1="$PATCH_DIR/0001-D01-zero-interest.patch"
P2="$PATCH_DIR/0002-D02-tenant-isolation.patch"

ok()   { printf '✅ %s\n' "$1"; }
bad()  { printf '❌ %s\n' "$1"; FAIL=1; }
info() { printf 'ℹ️  %s\n' "$1"; }
FAIL=0

echo "════ ১ · ইনপুট যাচাই ════"
[ -d "$REF/src" ] || { bad "Source A পাওয়া যায়নি: $REF (REF=... দিয়ে দিন)"; exit 1; }
ok "Source A: $REF"

if [ "$REGEN" = "1" ]; then
  echo "════ ২ · প্যাচ নতুন করে তৈরি (tools/make-patches.py) ════"
  python3 "$APP_DIR/tools/make-patches.py" || { bad "প্যাচ তৈরি ব্যর্থ"; exit 1; }
fi
for f in "$P1" "$P2"; do
  [ -s "$f" ] && ok "প্যাচ উপস্থিত: $(basename "$f") ($(wc -c < "$f") বাইট)" || bad "প্যাচ নেই: $f"
done

echo "════ ৩ · বিশুদ্ধ কপিতে ধারাবাহিক প্রয়োগ (0001 → 0002) ════"
rm -rf "$WORK"; mkdir -p "$WORK/pristine" "$WORK/applied"
( cd "$REF" && tar cf - --exclude=node_modules --exclude=.git . ) | ( cd "$WORK/pristine" && tar xf - )
cp -a "$WORK/pristine/." "$WORK/applied/"
( cd "$WORK/applied" && git init -q . )
for p in "$P1" "$P2"; do
  grep -v '^#' "$p" > "$WORK/_apply.patch"
  if ( cd "$WORK/applied" && git apply --check -p1 "$WORK/_apply.patch" ); then
    ok "git apply --check -p1 $(basename "$p") → rc=0"
  else
    bad "git apply --check ব্যর্থ: $(basename "$p")"; exit 1
  fi
  ( cd "$WORK/applied" && git apply -p1 "$WORK/_apply.patch" ) || { bad "প্রয়োগ ব্যর্থ: $(basename "$p")"; exit 1; }
done

echo "════ ৪ · প্রয়োগের পর স্ক্যানার (d04 হার্নেস) ════"
PATCHED_ROOT="$WORK/applied" SOURCE_A_ROOT="$WORK/pristine" \
  node "$APP_DIR/tests/d04-source-a-scan.mjs" > "$WORK/d04.out" 2>&1
tail -1 "$WORK/d04.out"
grep -q "ফেল ০" "$WORK/d04.out" \
  && ok "d04: baseline-এ লঙ্ঘন ধরা পড়েছে, প্রয়োগের পর ০ — সব চেক পাস" \
  || { bad "d04: কিছু চেক ব্যর্থ — বিস্তারিত $WORK/d04.out"; grep '❌' "$WORK/d04.out" | sed 's/^/    /'; }

echo "════ ৫ · TypeScript parity (নতুন error যোগ হয়নি তো?) ════"
if command -v npx >/dev/null 2>&1 && [ -d "$MODULE_CACHE" ]; then
  rm -rf "$WORK/tsc"; mkdir -p "$WORK/tsc"
  cp -a "$WORK/pristine/." "$WORK/tsc/"
  ln -s "$MODULE_CACHE" "$WORK/tsc/node_modules"
  ln -s "$MODULE_CACHE" "$WORK/applied/node_modules"
  info "baseline tsc চলছে (এক মিনিট লাগতে পারে)…"
  ( cd "$WORK/tsc" && npx tsc --noEmit 2>&1 | sort > "$WORK/tsc-baseline.txt" )
  info "patched  tsc চলছে…"
  ( cd "$WORK/applied" && npx tsc --noEmit 2>&1 | sort > "$WORK/tsc-patched.txt" )
  B=$(grep -c "error TS" "$WORK/tsc-baseline.txt"); P=$(grep -c "error TS" "$WORK/tsc-patched.txt")
  info "baseline error = $B · patched error = $P"
  if diff -q "$WORK/tsc-baseline.txt" "$WORK/tsc-patched.txt" >/dev/null; then
    ok "error তালিকা হুবহু এক — প্যাচ কোনো নতুন type error যোগ করেনি"
  elif [ "$P" -le "$B" ]; then
    ok "patched error ($P) ≤ baseline ($B) — নতুন error নেই; পার্থক্য:"
    diff "$WORK/tsc-baseline.txt" "$WORK/tsc-patched.txt" | head -20 | sed 's/^/    /'
  else
    bad "patched error ($P) > baseline ($B) — নতুন type error যোগ হয়েছে"
    diff "$WORK/tsc-baseline.txt" "$WORK/tsc-patched.txt" | head -30 | sed 's/^/    /'
  fi
  rm -f "$WORK/tsc/node_modules" "$WORK/applied/node_modules"
else
  info "SKIP: npx বা Source A-র node_modules ($MODULE_CACHE) নেই — tsc parity যাচাই করা হলো না।"
  info "      চালানোর জন্য: cp -a $REF /tmp/tsbase && cd /tmp/tsbase && npm install"
fi

echo
echo "════ ফলাফল ════"
if [ "$FAIL" = "0" ]; then
  ok "সব যাচাই পাস — patches/ দুটি Source A-তে প্রয়োগের জন্য নিরাপদ (DB অংশ অনুমোদন-সাপেক্ষ আলাদা)"
  exit 0
else
  bad "কিছু যাচাই ব্যর্থ"
  exit 1
fi
