# SteadyUp: build spec

As of Oct 22, 2026. Entry for the Amazon Developer Hackathon, **Fire TV track**. Deadline Fri Oct 23, 12:00 PM PT (3:00 PM ET).

Build order and "done when" checks are in docs/SLICES.md. Where the two disagree, SLICES.md wins.

## One sentence

SteadyUp turns any Fire TV into a balance and strength coach for older adults: the phone they already own is the camera, the TV is the coach, and the family sees the progress.

## The problem (cite these, nothing else)

| Fact | Source |
| --- | --- |
| Over 14 million, or 1 in 4, US adults 65+ report falling every year | CDC, Older Adult Falls Data: https://www.cdc.gov/falls/data-research/index.html |
| Fall death rate for older adults rose 21%, from 64.7 to 78.4 per 100,000 (2018 to 2024) | Same CDC page |
| Exercise reduces the rate of falls by 23% (59 trials, 12,981 people); balance and functional exercise by 24% (39 trials, 7,920 people) | Cochrane review CD012424 (2019): https://pubmed.ncbi.nlm.nih.gov/30703272/ |
| Smart-gym form feedback costs thousands: Tonal 2 is $4,295 + $59.95/month | https://www.garagegymreviews.com/tonal-review |
| Peloton's $295 TV camera for strength (Guide) stopped selling on July 30, 2025; Amazon shut down Halo in 2023 | https://macmyths.com/peloton-guide-review-2026-is-the-discontinued-strength-camera-worth-buying/ , https://www.fox10phoenix.com/news/amazon-axes-halo-fitness-program-how-to-get-a-refund |

**Our angle:** the hardware was the barrier. A phone people already own costs $0. Video never leaves the phone.

**Never claim:** that SteadyUp prevents falls, detects falls, diagnoses anything, or is medical. Say "balance and strength exercises, the kind studies link to fewer falls."

## Users

- **Mom (72):** does the exercises. Uses only the Fire TV remote: arrows, OK, Back. Never types.
- **Ana (her daughter, another city):** pairs once, sees the weekly summary, can join "move together".
- **Judges:** must be able to try it with a laptop webcam, no phone needed.

## Hackathon rules this must meet

- App works on **Fire OS** (Android). Fire OS 8 = Android 11, API 30; Fire OS 7 = API 28. No Google Play services on Fire devices.
- Demo video under 3 minutes showing the app on a Fire TV device or simulator. FAQ: "an emulator (Android TV Emulator or the Fire TV/Vega simulator) is fine."
- Code on GitHub, public with an open source license (MIT), with all source and instructions.
- Judged equally on: technical implementation, design, potential impact, quality of the idea. Friction log adds up to 10%.
- Fire TV priority categories we hit: fitness, computer vision, multi-modal UX, family entertainment.

## Architecture

```
Phone or laptop browser (web/)            AWS us-east-1 (server/)                Fire TV app (android/)
 camera -> MediaPipe Pose (on device)  ->  API Gateway WebSocket + Lambda    ->  stick figure, reps, cues, TTS
 rep + form engine (TypeScript)            DynamoDB (sessions, history)          session flow, safety screens
 sends: 33 landmarks + rep/cue events      Bedrock Claude (weekly plan only)     pairing QR + code
 never video                               HTTP API for pages + summaries
```

- **Pose:** `@mediapipe/tasks-vision` PoseLandmarker (lite model), running in the browser. Pin the exact version. Up to 30 fps.
- **Rep and form engine:** pure TypeScript in `web/src/engine/`, no DOM, unit-tested on landmark fixtures. Counting happens on the phone; the TV only displays.
- **Messages** (JSON over WebSocket, under 4 KB each): `pose` (landmarks, throttled to 20/s to the TV), `rep` (move, count), `cue` (text), `state` (set started/ended).
- **TV:** Kotlin, Jetpack Compose for TV (`androidx.tv`), OkHttp WebSocket, Android `TextToSpeech`. minSdk 28, target the latest the toolchain allows; test on an Android TV emulator API 30.
- **AI:** Bedrock Claude Haiku-class (list available IDs with `aws bedrock list-foundation-models --by-provider anthropic`). Used only after a session, never in the live loop. Output validated with zod. Failure keeps the current plan.
- **Infra:** AWS CDK v2 TypeScript. Static phone pages served from S3 + CloudFront (HTTPS is required for camera access) or from the HTTP Lambda; pick the simpler working one.
- **Cost:** pay-per-request everything; no always-on servers.

## The five moves (all chair-supported, phone facing the person from the front, 2 m away)

Thresholds are starting points. Tune them on fixtures and log the final values in PROGRESS.md.

| Move | Count rule | Form cue (one only) |
| --- | --- | --- |
| Sit to stand | Hip height (normalized by torso length) goes from seated band to standing band and back = 1 rep | Knees drift inward relative to ankles -> "Keep knees over toes" |
| Heel raises (hands on chair) | Heels rise above baseline by over 3% of leg length, then return = 1 rep | Torso leans over 15 degrees -> "Stand tall" |
| Side leg raise (each side) | Hip abduction angle over 20 degrees, then back under 8 = 1 rep | Torso tilts over 12 degrees -> "Keep your body still" |
| Marching in place | Knee rises above mid-thigh line, alternating = 1 rep per knee | No cue beyond "Hold the chair" if wrists leave chair height |
| Tandem stance hold | Feet in line (ankle x within 0.08 of torso width) = timer runs | Sway over threshold -> "Hold the chair, that's fine" |

If landmarks are low-confidence (visibility under 0.5 on needed joints), count nothing and say "Step back so I can see your whole body."

## Screens

**TV:** Pair (QR + 6-digit code) -> First-run safety -> Home (Start today's 10 minutes / Move together / This week) -> Move intro (picture, one sentence, "Hold the chair") -> Live set (stick figure, big rep count, target, cue line) -> Rest (20 s) -> Finish (totals, "See you tomorrow").

**Phone:** Join (scan or type code) -> Camera check ("Can I see your whole body?" green tick) -> Live (small preview, rep count) -> Done. Family page: weekly summary, streak, "Move together" invite.

## Plain language and design

- Text on TV at least 40 sp; high contrast; focus ring at least 6 dp; one main action per screen.
- Sentences under 12 words. No tech words: no "landmark", "pose", "WebSocket", "sync", "API", "error code".
- Every error keeps the session usable and says one friendly sentence.
- Spoken cues at most one every 5 seconds.

## Safety and privacy (put on a "How it works" screen and in README)

- First run: "Check with your doctor before starting new exercise. Always use a sturdy chair."
- Before every set: "Hold the back of the chair."
- If the person disappears from view for 10 seconds during a set: pause and say "Paused. Press OK when you're ready." No fall detection claim.
- Video never leaves the phone. Only body points and counts are sent. History keeps counts, not body points.

## AI weekly plan

Input: last 7 days of sets (move, target, done, cues triggered). Output JSON: per move, next target. Hard limits enforced in code after the model: change at most +2 or -2 reps (or +-5 s for the hold) per week; never above 15 reps or 30 s. One plain sentence per change, e.g. "You did 8 every day. Let's try 10."

## Move together

Two paired sessions in one room code. Each TV shows both stick figures side by side, labelled "You" and "Ana". Reps count separately; a shared "Together: 18" total. No video, only body points.

## Demo script (2:45)

1. 0:00 Stat: "1 in 4 adults over 65 fall every year. Balance exercise cuts falls by about a quarter. But a coach costs thousands." (CDC, Cochrane on screen)
2. 0:20 Mom opens SteadyUp on Fire TV, scans the QR with her phone, leans it on a shelf.
3. 0:40 Stick figure copies her. Sit to stand: reps count. On rep 4: "Keep knees over toes."
4. 1:20 Finish screen. Ana's phone shows "4 sessions this week, up from 2." The plan says "You did 8 every day. Let's try 10."
5. 1:50 Move together: Mom and Ana side by side, "Together: 18".
6. 2:20 Privacy: "Video never leaves your phone." Built for Fire OS, runs on the Fire TV you already own. Close.

## Not in scope for Friday

Real Fire TV hardware (optional if available), Amazon Appstore publishing (needs review; do after), Alexa skill, payments, accounts beyond pairing codes.
