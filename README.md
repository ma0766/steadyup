# SteadyUp

**SteadyUp turns any Fire TV into a balance and strength coach for older adults.** The phone people already own is the camera, the TV is the coach, and the family sees the progress.

Entry for the Amazon Developer Hackathon, Fire TV track. Categories it touches: fitness, computer vision, multi-modal UX, family entertainment.

> SteadyUp offers balance and strength exercises, the kind studies link to fewer falls. It is not medical advice and makes no health claims of its own. Check with your doctor before starting new exercise. Always use a sturdy chair.

## Why

| Fact | Source |
| --- | --- |
| Over 14 million, or 1 in 4, US adults 65+ report falling every year | [CDC, Older Adult Falls Data](https://www.cdc.gov/falls/data-research/index.html) |
| Fall death rate for older adults rose 21%, from 64.7 to 78.4 per 100,000 (2018 to 2024) | Same CDC page |
| Exercise reduces the rate of falls by 23% (59 trials, 12,981 people); balance and functional exercise by 24% (39 trials, 7,920 people) | [Cochrane review CD012424 (2019)](https://pubmed.ncbi.nlm.nih.gov/30703272/) |
| Smart-gym form feedback costs thousands: Tonal 2 is $4,295 + $59.95/month | [Garage Gym Reviews](https://www.garagegymreviews.com/tonal-review) |
| Peloton's $295 TV camera for strength (Guide) stopped selling on July 30, 2025; Amazon shut down Halo in 2023 | [MacMyths](https://macmyths.com/peloton-guide-review-2026-is-the-discontinued-strength-camera-worth-buying/), [FOX 10](https://www.fox10phoenix.com/news/amazon-axes-halo-fitness-program-how-to-get-a-refund) |

The hardware was the barrier. A phone people already own costs $0. Video never leaves the phone.

## How it works

```
Phone or laptop browser (web/)          AWS us-east-1 (server/)               Fire TV app (android/)
 camera -> MediaPipe Pose (on device) -> API Gateway WebSocket + Lambda   ->  stick figure, reps, cues, voice
 rep + form engine (TypeScript)         DynamoDB (codes, history, plan)       session flow, safety screens
 sends body points + counts only        HTTP API + S3/CloudFront (pages)      pairing QR + number
 never video                            Bedrock Claude Haiku (weekly plan only)
```

- **Mom (72)** uses only the remote: arrows, OK, Back. She scans a QR with her phone, leans it on a shelf, and follows the stick figure.
- **Ana (her daughter)** opens a family link (a QR on the TV), sees the week and the streak, and can **move together** from her own phone and camera.
- **Judges** can try it with a laptop webcam and no phone: open the phone page on the laptop and type the number the TV shows.

### The five chair-supported moves
Sit to stand, heel raises (hands on chair), side leg raise (each side), marching in place, tandem stance hold. Each has one plain form cue. Counting happens on the phone; the TV only displays.

### Safety and privacy (also shown in the app)
- First run: "Check with your doctor before starting new exercise. Always use a sturdy chair."
- Before every set: "Hold the back of the chair."
- If the person is out of view for 10 seconds the set pauses: "Paused. Press OK when you're ready."
- **Video never leaves the phone.** Only body points and counts are sent. History stores counts only. The history API rejects any extra field (a test reads the table to prove it).
- AI is used once a week, after a session, to suggest next targets. It never runs in the live loop. Code limits every change to +-2 reps (+-5 seconds for the hold) and never above 15 reps or 30 seconds.

## Try it

You can drive the whole thing from this repo.

### Prerequisites
Node 22, JDK 17, the Android SDK (platform 35, build-tools 35.0.0), Docker is not needed. For the TV: an Android TV emulator, API 30 (Android 11, the same as Fire OS 8). For your own cloud copy: an AWS account with CDK bootstrapped in us-east-1.

### From a clean clone
```bash
git clone <this repo> && cd steadyup
npm ci
npm test                      # unit tests: rep engine, server, TV logic helpers (no network)
node scripts/make-fixtures.mjs   # downloads the fake-camera video used by the browser tests
```

### The Fire TV app on an emulator
FAQ: "an emulator (Android TV Emulator or the Fire TV/Vega simulator) is fine." We use the Android TV emulator, API 30.
1. Android Studio -> Device Manager -> Create device -> TV -> Television (1080p) -> system image API 30 -> start it.
2. `source scripts/env.sh` (edit the `ADB` path to your adb), then `npm run apk` builds and installs the app and launches it.
3. The TV shows a QR and a 6-number code. On a laptop or phone open the address printed under the code, type the number, and allow the camera.
4. Press OK on the remote (or Enter on the emulator keyboard) through the safety screen and Home, then "Start today's 10 minutes".

### Your own cloud copy
`npm run deploy` builds the pages, deploys the CDK stack (pay-per-request only: no always-on servers) and writes the URLs to `config/endpoints.json`, which the tests and the Android build read. The committed file points at the demo stack.

### Everything at once
`npm run verify` runs typecheck, unit tests, the end-to-end tests (Playwright with a fake camera, plus the emulator), Gradle tests, and a live Bedrock smoke call, then prints PASS or FAIL for each build slice. See `docs/PROGRESS.md` for the proof of each slice, the decisions, and the tuned thresholds.

## Repo map
- `android/` Kotlin, Jetpack Compose for TV, OkHttp WebSocket, Android TextToSpeech, ZXing core. No Google Play services or Firebase.
- `web/` Vite + TypeScript. `web/src/engine/` is the pure rep and form engine.
- `server/` TypeScript, AWS CDK v2, API Gateway WebSocket + HTTP API, Lambda (Node 22), DynamoDB on-demand, S3 + CloudFront, Bedrock for the weekly plan.
- `tests/` Playwright end-to-end tests and the scripted phone used for TV flow tests.
- `docs/` spec, slices, progress, demo script, fixtures, friction log inputs, screenshots.

## Honest limits
- Tested on the Android TV emulator, not on a physical Fire TV device. Fire OS 8 is Android 11 (API 30); the app targets that.
- The rep engine thresholds were tuned on synthetic landmark streams and one real exercise video (a back-view squat). A real person doing sit to stand should be checked before relying on the counts.
- The emulator has no speech voice, so spoken cues are verified by logs and tests, not by ear.
- See `docs/MORNING-REPORT.md` for the full list.

## Sources
The five statistics above are the only facts cited. Video for tests: Wikimedia Commons, CC BY 3.0 (see `docs/FIXTURES.md`).

## License
MIT. See `LICENSE`.
