# SteadyUp

**1 in 4 adults over 65 fall every year, and balance and strength exercise is linked to about a quarter fewer falls, but a coach costs thousands.**
SteadyUp turns the Fire TV you already own into that coach: your phone is the camera, the TV coaches, and your family sees the progress.
It also runs the CDC's 30-second chair stand check, so you have a number to share with your doctor. Video never leaves your phone.

Entry for the Amazon Developer Hackathon, Fire TV track (fitness, computer vision, multi-modal UX, family entertainment).

> SteadyUp offers balance and strength exercises, the kind studies link to fewer falls. It is not medical advice and makes no health claims of its own. It never says what a score means for you. Check with your doctor before starting new exercise. Always use a sturdy chair.

## The problem, with sources

| Fact | Source |
| --- | --- |
| Over 14 million, or 1 in 4, US adults 65+ report falling every year | [CDC, Older Adult Falls Data](https://www.cdc.gov/falls/data-research/index.html) |
| Fall death rate for older adults rose 21%, from 64.7 to 78.4 per 100,000 (2018 to 2024) | Same CDC page |
| Exercise reduces the rate of falls by 23% (59 trials, 12,981 people); balance and functional exercise by 24% (39 trials, 7,920 people) | [Cochrane review CD012424 (2019)](https://pubmed.ncbi.nlm.nih.gov/30703272/) |
| Smart-gym form feedback costs thousands: Tonal 2 is $4,295 + $59.95/month | [Garage Gym Reviews](https://www.garagegymreviews.com/tonal-review) |
| Peloton's $295 TV camera for strength (Guide) stopped selling on July 30, 2025; Amazon shut down Halo in 2023 | [MacMyths](https://macmyths.com/peloton-guide-review-2026-is-the-discontinued-strength-camera-worth-buying/), [FOX 10](https://www.fox10phoenix.com/news/amazon-axes-halo-fitness-program-how-to-get-a-refund) |

The hardware was the barrier. A phone people already own costs $0.

## Why Fire TV

- **It is already in the living room, and it is cheap.** The people who need this most do not buy a $4,295 smart gym. They have a TV and a remote.
- **Remote-only.** Mom never types. Arrows, OK and Back do everything; the first button on every screen has focus, with a thick focus ring; Back always goes somewhere sensible.
- **Built for Fire OS, not just Android TV.** Leanback launcher entry with a 320x180 banner, no touchscreen needed, `minSdk 28` (Fire OS 7) and API 30 tested (Fire OS 8), and **no Google Play services, Firebase or ML Kit anywhere** (`npm run verify` scans the dependency tree). Pose tracking runs on the phone because Fire devices have no Play services.
- **Big text, big spaces.** TV text is at least 40 sp, sentences are under 12 words, and there are no tech words on any screen (tests scan for them).
- **No voice on the device? Still fine.** If the TV has no speech engine, form cues are shown larger on screen instead.

## The CDC 30-second chair stand check

From Home, "Chair stand check" runs the CDC STEADI 30-Second Chair Stand test with CDC's instructions: sit in the middle of a chair without arms, feet flat, **arms crossed on the chest**, stand all the way up then sit down, as many as you can in 30 seconds.

1. First question: "Can you stand up from a chair without using your hands?" If not, we skip the test.
2. Optional age band and sex.
3. A 3-2-1 countdown, 30 seconds with a live count, then the score next to the CDC number: *"CDC lists under 10 as below average for your age. Share this number with your doctor."* (The number comes from CDC's table for the age band and sex you chose; skip them and we say CDC has numbers by age and sex.)
4. The score is saved; the family page shows the trend.

We never diagnose and never say what a score means for you. Sources: [CDC STEADI](https://www.cdc.gov/steadi/) and its "30-Second Chair Stand" assessment form (find it on the STEADI page). The below-average table in `android/app/src/main/java/com/steadyup/tv/Cdc.kt` is CDC's: men/women under 14/12 (60-64), 12/11 (65-69), 12/10 (70-74), 11/10 (75-79), 10/9 (80-84), 8/8 (85-89), 7/4 (90-94).

## How it works

```
Phone or laptop browser (web/)          AWS us-east-1 (server/)               Fire TV app (android/)
 camera -> MediaPipe Pose (on device) -> API Gateway WebSocket + Lambda   ->  stick figure, reps, cues, voice
 rep + form engine (TypeScript)         DynamoDB (codes, history, plan)       session flow, safety screens
 learns YOUR standing/sitting levels    HTTP API + S3/CloudFront (pages)      pairing QR + number, family QR
 sends body points + counts only        Bedrock Claude Haiku (weekly plan)
 never video
```

- **Mom (72)** uses only the remote. She scans a QR with her phone, leans it on a shelf, does two slow stands so SteadyUp learns how *she* moves (any height, any distance from the camera), and follows the stick figure.
- **Ana (her daughter)** opens a family link (a QR on the TV), sees the week, the streak and the chair stand trend, and can **move together** from her own phone and camera.
- **Judges** can try it with a laptop webcam and no phone: open https://dh3aa2spgh07i.cloudfront.net on the laptop and type the number the TV shows.

### The five chair-supported moves
Sit to stand, heel raises (hands on chair), side leg raise (each side), marching in place, tandem stance hold. Each has one plain form cue. Counting happens on the phone; the TV only displays.

### Safety and privacy (also shown in the app)
- First run: "Check with your doctor before starting new exercise. Always use a sturdy chair."
- Before every set: "Hold the back of the chair."
- If the person is out of view for 10 seconds the set pauses: "Paused. Press OK when you're ready."
- **Video never leaves the phone.** Only body points and counts are sent. History stores counts only; the history API rejects any extra field (a test reads the table to prove it).
- AI is used once a week, after a session, to suggest next targets. It never runs in the live loop. Code limits every change to +-2 reps (+-5 seconds for the hold), never above 15 reps or 30 seconds, and one refresh per week.
- Pairing and family numbers allow 5 wrong tries a minute per address, then a one-minute wait.

## Where the code is

| What | Where |
| --- | --- |
| Rep and form engine (pure TypeScript) | `web/src/engine/` (`sitToStand.ts`, `heelRaise.ts`, `sideLegRaise.ts`, `march.ts`, `tandemHold.ts`, `chairStand.ts`, thresholds in `thresholds.ts`) |
| Personal calibration (two slow stands) | `web/src/engine/calibration.ts` |
| Phone camera, pose, send loop | `web/src/live.ts`, `web/src/pose.ts`, `web/src/main.ts` |
| Family page and "move together" page | `web/family.html`, `web/together.html`, `web/src/family.ts`, `web/src/together.ts` |
| TV session as a state machine | `android/app/src/main/java/com/steadyup/tv/SessionMachine.kt` |
| TV screens | `.../Screens.kt`, `.../MainActivity.kt` |
| CDC chair stand table and wording | `.../Cdc.kt` |
| Relay: pairing, rooms, rate limits | `server/src/pairing.ts`, `server/src/handler.ts` |
| History, family summary, chair trend | `server/src/api.ts`, `server/src/summary.ts` |
| AI weekly plan and its caps | `server/src/plan.ts` |
| Infrastructure (CDK) | `server/infra/stack.ts` |
| Tests | `web/src/**/*.test.ts`, `server/src/*.test.ts`, `android/app/src/test/`, `tests/e2e/`, `tests/unit/` |
| Proof of every slice, decisions, tuned numbers | `docs/PROGRESS.md`, `docs/screens/` |
| What a judge would criticise (and what we fixed) | `docs/AUDIT.md` |

## Try it

### Prerequisites
Node 22, JDK 17, the Android SDK (platform 35, build-tools 35.0.0). For the TV: an Android TV emulator, API 30 (Android 11, the same as Fire OS 8). For your own cloud copy: an AWS account with CDK bootstrapped in us-east-1.

### From a clean clone
```bash
git clone <this repo> && cd steadyup
npm ci
npm test                         # unit tests: rep engine, calibration, server, TV logic helpers (no network)
node scripts/make-fixtures.mjs   # downloads the fake-camera video used by the browser tests
```

### The Fire TV app on an emulator
FAQ: "an emulator (Android TV Emulator or the Fire TV/Vega simulator) is fine." We use the Android TV emulator, API 30.
1. Android Studio -> Device Manager -> Create device -> TV -> Television (1080p) -> system image API 30 -> start it.
2. `source scripts/env.sh` (edit the `ADB` path to your adb), then `npm run apk` builds and installs the app and launches it.
3. The TV shows a QR and a 6-number code. On a laptop or phone open the SteadyUp page (the demo copy is at https://dh3aa2spgh07i.cloudfront.net; your own copy's address is in `config/endpoints.json`), type the number the TV shows, and allow the camera. A phone that scans the QR needs no typing at all.
4. Press OK on the remote (or Enter on the emulator keyboard) through the safety screen and Home. "Start today's 10 minutes" begins with two slow stands, then the first move.

### Your own cloud copy
`npm run deploy` builds the pages, deploys the CDK stack (pay-per-request only: no always-on servers) and writes the URLs to `config/endpoints.json`, which the tests and the Android build read. `STAGE=name npm run deploy` makes a separate copy (`SteadyUp-name`) that never touches the main one.

### Everything at once
`npm run verify` runs typecheck, unit tests, the end-to-end tests (Playwright with a fake camera, plus the emulator), Gradle tests, a live Bedrock call, a Google Play services scan and a Lighthouse accessibility check, then prints PASS or FAIL for each build slice.

## Honest limits and next steps

- **Not yet tried by an older adult.** Counting was tuned on synthetic bodies (3 builds x 3 distances, all count 10 of 10) and one real exercise video. Calibration makes it adapt to the person, but a real front-view trial is the next step.
- Tested on the Android TV emulator, not on a physical Fire TV. Fire OS 8 is Android 11 (API 30); the app targets that. The emulator has no voice, so spoken cues are verified by logs and tests, not by ear.
- The demo history on the family page is seeded with `scripts/seed-demo-history.mjs`; real use starts empty.
- One guest per "move together" room; a second real TV joining a room is not built.
- **Next:** try it with 2 or 3 people over 65 and add their words; list on the Amazon Appstore; a free-for-family model so the person exercising never pays and families can add a coach later.

## Sources
The five statistics above and the CDC STEADI chair stand table are the only facts cited. Video for tests: Wikimedia Commons, CC BY 3.0 (see `docs/FIXTURES.md`).

## License
MIT. See `LICENSE`.
