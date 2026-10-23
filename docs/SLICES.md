# SteadyUp: vertical slices

Each slice works end to end and ships with its own tests and a "done when" check. Never start a slice while an earlier slice's tests fail. Never weaken a test.

Priority if the night runs short: S0-S5 are the demo. S6-S8 make it win. S9 is required for submission (do it before stopping, whatever else is unfinished).

## S0 Walking skeleton
- **Builds:** repo layout `android/`, `server/`, `web/`, root `package.json` scripts; CDK stack with WebSocket API + Lambda + DynamoDB + HTTPS hosting for `web/`; Fire TV app that opens to a "SteadyUp" screen; phone page that says hello; `npm run verify` prints a per-slice PASS/FAIL table.
- **Done when:** APK installs and launches on the Android TV emulator (adb screenshot `docs/screens/s0-tv.png`); deployed phone page loads over HTTPS (Playwright screenshot); WebSocket echo test passes against the deployed URL.

## S1 Pairing
- **Builds:** TV shows QR + 6-digit code (expires in 10 min, single use); phone page joins by scan or typing; both show "Connected".
- **Done when:** e2e: Playwright phone page enters the code from the TV (read via a test hook or adb logcat) and the TV screen changes to "Connected" (screenshot). Expired and reused codes are refused with a friendly sentence.

## S2 Live mirror
- **Builds:** phone runs MediaPipe PoseLandmarker on the camera; sends landmarks (throttled 20/s); TV draws a smooth stick figure. Latency measured end to end and logged.
- **Test input:** Playwright Chromium with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<file>.y4m`. Get a short, freely licensed video of a person exercising (e.g. Pexels, record the license URL in docs/FIXTURES.md), convert with ffmpeg to y4m 640x480. If none can be fetched, generate synthetic landmark streams instead and log it.
- **Done when:** TV screenshot shows the stick figure from the fake camera; median latency phone -> TV logged (target under 200 ms on the deployed stack).

## S3 Rep engine: sit to stand
- **Builds:** `web/src/engine/` pure TS: smoothing, normalization by torso length, state machine per move, confidence gate. Fixture recorder page that saves landmark streams to JSON.
- **Done when:** unit tests on fixtures (recorded from the fake video or synthetic) count 10/10 sit-to-stands exactly, and 0 when the person is out of frame; knee-inward cue fires on a fixture with knees caving and not on a clean one.

## S4 Session flow on TV
- **Builds:** first-run safety screen; Home; Move intro; Live set (big count, target, cue line); Rest 20 s; Finish totals. Spoken cues with TextToSpeech, max one per 5 s. Pause when the person is out of view 10 s.
- **Done when:** a scripted run with the fake camera completes a 3-move session; screenshots of each screen; TTS calls verified in an instrumented or unit test.

## S5 All five moves
- **Builds:** heel raises, side leg raise (both sides), marching, tandem hold timer, each with its one cue.
- **Done when:** unit tests per move on fixtures (positive, negative, low-confidence); a full 10-minute session (time-compressed in test) completes.

## S6 History and family page
- **Builds:** sets saved to DynamoDB (counts only); family page by invite link shows this week, streak, last session; TV "This week" screen.
- **Done when:** e2e shows a finished session appearing on the family page within 10 s; no body points stored (test reads the table).

## S7 AI weekly plan
- **Builds:** Bedrock call after a session or on demand; zod-validated JSON; code-enforced caps (+-2 reps, +-5 s, max 15 reps / 30 s); one plain sentence per change; failure keeps the current plan. Mock Bedrock in unit tests; one live call in a smoke test.
- **Done when:** tests show the cap holds even when the mock model asks for +10; the live smoke call returns a valid plan (or is logged as blocked on user if Bedrock access fails).

## S8 Move together
- **Builds:** room code joins two people; each TV (or the one emulator, split view) shows both stick figures labelled "You" and the other's name; shared total.
- **Done when:** e2e with two fake-camera browser pages shows both figures and "Together: N" on the TV (screenshot).

## S9 Submission pack (always do this)
- **Builds:** README (what, why with the cited stats, quickstart from clean clone, emulator steps, the FAQ line on emulators, privacy, safety, sources); MIT LICENSE; FEEDBACK.md (every Amazon/AWS tool used, what worked, what didn't); FRICTION_LOG.md with columns: step, severity, what happened (leave for human), workaround, suggestion, and entries for anything hit (include: Vega SDK not supported on WSL; Rules vs FAQ wording on emulators); docs/DEMO.md (the 2:45 script from SPEC.md, with exact clicks); docs/screens/ refreshed; docs/MORNING-REPORT.md.
- **Done when:** a clean clone into a temp folder builds the APK and passes `npm test`; gitleaks (Docker, or `npx gitleaks` alternative) finds no secrets; `npm audit` has no high or critical.

## Manual checks left for the human (morning)
- 10 minutes with a real laptop webcam and a real phone: do 10 sit-to-stands, check count and cue.
- Optional: sideload onto a real Fire TV Stick.
- Record the video; fill the friction log "what happened" column; make the repo public; submit.
