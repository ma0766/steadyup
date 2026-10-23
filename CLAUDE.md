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

- Windows, run from Git Bash. Android Studio is installed; the Android TV emulator (API 30, 1080p) should already be running. Find the SDK at `%LOCALAPPDATA%\Android\Sdk`; use its `platform-tools/adb` and `emulator/emulator`. If no device shows in `adb devices`, start the first TV AVD with `emulator -avd <name> -no-snapshot-load` in the background and wait for boot.
- Node 22, AWS CLI v2 logged in for us-east-1, Docker optional.
- Build the APK with `android/gradlew assembleDebug`; install with `adb install -r`; screenshot with `adb exec-out screencap -p > docs/screens/<name>.png`.

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
