#!/usr/bin/env bash
# S9 check: a fresh clone builds the APK and passes `npm test`.  Usage: bash scripts/clean-clone-check.sh
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone --quiet "$SRC" "$TMP/steadyup"
cd "$TMP/steadyup"
npm ci --silent
npm test
source scripts/env.sh
(cd android && ./gradlew --no-daemon -q assembleDebug testDebugUnitTest)
test -f android/app/build/outputs/apk/debug/app-debug.apk
echo "CLEAN CLONE OK: npm test passed, APK built, Gradle tests passed"
