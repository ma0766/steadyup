#!/usr/bin/env bash
# Fire OS has no Google Play services: fail if any dependency of the app (debug or release) pulls one in.
set -euo pipefail
cd "$(dirname "$0")/../android"
source ../scripts/env.sh
OUT="$(./gradlew --no-daemon -q :app:dependencies --configuration debugRuntimeClasspath; ./gradlew --no-daemon -q :app:dependencies --configuration releaseRuntimeClasspath)"
if echo "$OUT" | grep -qiE "play-services|firebase|com\.google\.android\.gms|mlkit|com\.google\.android\.play"; then echo "FAIL: Google Play services found"; exit 1; fi
echo "OK: no Google Play services, Firebase or ML Kit anywhere in the app's dependencies ($(echo "$OUT" | grep -cE '^\S*[+\\]---') direct lines checked)"
