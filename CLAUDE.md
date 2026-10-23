# SteadyUp

Fire TV balance and strength coach for older adults. The phone is the camera (pose tracking runs on the phone, video never leaves it); the Fire TV app is the coach; family sees progress. Amazon Developer Hackathon, Fire TV track. **Deadline: Fri Oct 23, 12:00 PM PT (3:00 PM ET).**

- Spec: @docs/SPEC.md
- Build order and "done when" checks: @docs/SLICES.md
- Live progress: @docs/PROGRESS.md (update after every slice)

## How to work

- One slice at a time, in order. Done only when its "Done when" check passes and the proof is shown.
- After each slice: `npm run verify`, update docs/PROGRESS.md, `git commit -m "S<n>: <name>"`, `git push`.
- Never weaken, skip or delete a test. Fix the code.
- Never ask the user questions. Pick the simplest option that fits the spec, log it under "Decisions" in PROGRESS.md, continue.
- Before closing a slice, a subagent reviews the diff against that slice in SLICES.md. Fix correctness or missing-requirement gaps only.
- If something truly needs the user (AWS login expired, Bedrock access, emulator not running), log it under "Blocked on user" and keep going on everything else with stand-ins, clearly labelled.

## Environment

- **You run in Debian on WSL2** (project at /home/madman/steadyup). Node 22, AWS CLI (us-east-1), Docker and git are already here. Git pushes use SSH. No sudo: never use `sudo` or apt.
- **Android build tools live in WSL, installed by you in S0 without sudo:** download Eclipse Temurin JDK 17 (Linux x64 tar.gz) into `~/tools/jdk17`; Android command-line tools into `~/android-sdk/cmdline-tools/latest`; then `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"` and accept licenses (`yes | sdkmanager --licenses`). Write `export JAVA_HOME=...`, `ANDROID_HOME=~/android-sdk` and PATH lines to `scripts/env.sh` and source it in every npm script that builds Android.
- **The emulator runs on Windows** (Android TV, API 30, 1080p, already running as emulator-5554). Use the Windows adb at `/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe`; save it as `ADB` in `scripts/env.sh`. Install: `"$ADB" install -r "$(wslpath -w android/app/build/outputs/apk/debug/app-debug.apk)"`. Screenshot: `"$ADB" exec-out screencap -p > docs/screens/<name>.png`. Launch: `"$ADB" shell am start -n <package>/<activity>`.
- If `"$ADB" devices` shows nothing, log "emulator not running" under Blocked on user, keep building and testing everything else, and retry every slice.
- The emulator reaches the deployed AWS URLs over the internet; don't rely on localhost between Windows and WSL for TV tests.

## Stack

- android/: Kotlin, Jetpack Compose for TV (`androidx.tv:tv-material`), OkHttp WebSocket, Android TextToSpeech, ZXing (or similar, no Google services) for the QR. minSdk 28. No Google Play services or Firebase.
- web/: Vite + TypeScript, no framework. `@mediapipe/tasks-vision` PoseLandmarker (pinned). Engine in `web/src/engine/` is pure TS.
- server/: TypeScript, AWS CDK v2, API Gateway WebSocket + Lambda (Node 22) + DynamoDB (on-demand) + HTTPS hosting for web/. Bedrock Claude Haiku-class for the weekly plan only. zod for validation.
- Tests: Vitest (engine, server), Playwright Chromium (phone pages, fake camera), Gradle unit tests (TV logic), adb screenshots for TV proof.

## Commands (create in S0, keep working)

- `npm run dev` local web + server stand-in
- `npm test` all unit tests (web, server)
- `npm run e2e` Playwright + emulator checks
- `npm run apk` build and install the APK on the running emulator
- `npm run verify` lint, typecheck, test, e2e, gradle test; prints per-slice PASS/FAIL
- `npm run deploy` cdk deploy

## Hard rules

- Video never leaves the phone. Only body points and counts are sent; history stores counts only.
- No medical, fall-prevention or fall-detection claims in the app or README beyond quoting the cited studies.
- Chair-supported moves only; safety screen on first run; "Hold the chair" before each set.
- TV text at least 40 sp; sentences under 12 words; no tech words a user can see.
- Every error keeps the session usable and shows one friendly sentence.
- AI never runs in the live loop; plan caps are enforced in code.
- Never commit secrets; AWS credentials come from the environment. No always-on paid resources.
