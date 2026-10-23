#!/usr/bin/env bash
# Build debug APK and install on the running Windows emulator.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
(cd android && ./gradlew --no-daemon -q assembleDebug)
APK=android/app/build/outputs/apk/debug/app-debug.apk
if ! "$ADB" devices | tr -d "\r" | grep -q "device$"; then echo "emulator not running"; exit 2; fi
# adb.exe can't read \\wsl.localhost paths reliably: stage the APK on the Windows side
WIN_DIR=/mnt/c/Users/angep/AppData/Local/Temp
cp "$APK" "$WIN_DIR/steadyup.apk"
"$ADB" install -r "C:\\Users\\angep\\AppData\\Local\\Temp\\steadyup.apk"
"$ADB" shell am start -n com.steadyup.tv/.MainActivity
