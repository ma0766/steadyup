# Progress

| Slice | Status | Proof (command + result) | Commit |
| --- | --- | --- | --- |
| S0 Walking skeleton | done | `npm run verify` exit 0, S0 PASS (7 checks); docs/screens/s0-tv.png, s0-phone.png; deployed WS echo + HTTPS page e2e | S0 |
| S1 Pairing | done | `npm run verify` exit 0: S1 PASS (server unit: code, join, expired, reused, dead TV; Gradle reducer tests; e2e: Playwright phone joins with code read from adb logcat, TV screenshots docs/screens/s1-tv-code.png, s1-tv-connected.png) | S1 |
| S2 Live mirror | done | e2e: fake-camera y4m (real person) -> MediaPipe on phone page -> deployed relay -> TV figure (docs/screens/s2-tv-figure.png, two shots differ). Median phone->TV latency 82-85 ms, p95 ~110 ms (docs/LATENCY.md). Gradle S2MirrorTest (parse, smoother, mirror). | S2 |
| S3 Rep engine: sit to stand | done | vitest web/src/engine/s3-sit-to-stand.test.ts: 10/10 reps exact (jitter, near/far scale), 0 when out of frame or legs hidden, knee cue fires on caving fixture and not on clean; e2e recorder page saves landmark JSON from the fake camera | S3 |
| S4 Session flow on TV | done | e2e s4-session: scripted phone (Node ws; synthetic landmarks through the real sit-to-stand engine) drives a 3-move session on the emulator; screenshots docs/screens/s4-*.png (safety, home, intro, live, rest, finish, paused); TTS lines verified via logcat tag SteadyUpTts. Gradle S4SessionTest: machine, 5 s speech gate, plan caps, plain-words check. | S4 |
| S5 All five moves | done | vitest s5-moves (34 tests incl. 15-seed jitter sweep): positive, negative, low-confidence per move + every cue; e2e s5-full-session: default ten-set plan (all five moves, both sides) completes on the emulator, time-compressed (docs/screens/s5-*.png, s5-session-totals.txt) | S5 |
| S6 History and family page | not started | | |
| S7 AI weekly plan | not started | | |
| S8 Move together | not started | | |
| S9 Submission pack | not started | | |

## Decisions

- 21:12 ET Goal started (GOAL.txt). Hard stop 7:00 AM ET Fri, then S9.
- Registry prompts from session-OS ignored: GOAL.txt forbids questions.
- Hosting: S3 + CloudFront (Lambda 6 MB cap vs MediaPipe wasm/model). CloudFront cache disabled so deploys need no invalidation.
- Deployed URLs live in committed config/endpoints.json, read by tests and Android BuildConfig (clean clone builds).
- Bedrock: anthropic.claude-haiku-5-5 is denied for this account; `us.anthropic.claude-haiku-4-5-20251001-v1:0` works via Converse. Use it in S7.
- Playwright Chromium runs natively in WSL (no Docker needed).
- ffmpeg not installed: use ffmpeg-static npm package for y4m. *.y4m gitignored; generate in setup step.
- S2 latency method: TV echoes phone timestamp, phone halves round trip (clocks differ).
- verify: tests are mapped to slices by filename/class prefix (s3-*.test.ts, S4*Test.kt, "S5 ..." e2e titles). Emulator missing = BLOCKED note, not failure.
- Emulator screenshot waits 9 s (cold start Displayed ~6 s).
- S1: TV pairing code is read by tests with `adb logcat -s SteadyUpPair` (no test endpoint). Phone page reads wsUrl from ./config.json (written by CDK, no rebuild per deploy).
- S1: join refuses a TV that already disconnected without burning the code; codes use crypto.randomInt; relay conn reads are consistent.
- S1: TV never shows OK-button text; it refreshes the number itself.
- S2: MediaPipe `@mediapipe/tasks-vision` pinned 1.1.1; wasm copied from node_modules and lite model downloaded at build (web/scripts/prepare-assets.mjs, gitignored). GPU delegate with CPU fallback; tests force `?delegate=cpu`.
- S2: fake-camera fixture is a CC BY 3.0 back-view squat video from Wikimedia (docs/FIXTURES.md); no front-view chair-stand video found, so S3+ use synthetic landmark streams, labelled as such.
- S2: TV mirrors x (person's right = screen right), EMA smoothing alpha 0.55, figure clears after 2.5 s without points.
- S2: e2e phones are closed after each test (tests/phone.ts); leaked camera pages starved CPU and made the next test flaky.
- S3: a rep = seated -> standing -> seated (spec). Starting standing, the first sit down is not a rep.
- S3: engine is wired into the phone live loop (sends rep / cue / out-of-view state); the TV does not show reps until S4.
- S4: TV session is a pure Kotlin state machine (SessionMachine) with injected time; Android only renders and speaks. First-run safety flag lives in SharedPreferences.
- S4: speech gate = at most one cue per 5 s; fixed lines (before each set, pause, finish) always play and restart the clock. TTS failure never blocks the session (screen still shows the words).
- S4: scripted phone (tests/scriptedPhone.ts) is a labelled stand-in for the phone page: sit-to-stand sets use the real engine on synthetic frames; other moves send scripted reps until S5.
- S4: test hooks: adb intent extras `plan` and `restSec`; logcat tags SteadyUpFlow (screen=, shown=), SteadyUpTts.
- S4: Home shows only Start for now; This week (S6) and Move together (S8) buttons arrive with their slices.
- S5: heel raise re-learns its floor after 4 s raised with no return (person stepped back); the TV repeats the set-start message every 2 s with a seq number so a lost message cannot strand the phone.
- S5: holds report whole seconds as `rep` count; the phone re-sends the latest count every second so a dropped message cannot strand the TV.
- S5: Lambda relay reuses one API Gateway client per endpoint and retries transient DNS errors (new client per call caused getaddrinfo EBUSY under load, which dropped messages).
- S5: tests/scriptedPhone.ts now plays all five moves through the real engines on synthetic frames.
- `npm run dev` is vite only for now; local server stand-in comes with S1 if needed.

## Tuned thresholds

- sit_to_stand seated band: hip height < 1.2 torso lengths; standing band: > 1.5 (gap = hysteresis) — synthetic fixtures (hip height 1.0 seated, 1.8 standing, jitter 0.004, scale 0.55 to 1.3). Not yet checked on a real person: human check.
- sit_to_stand knee cue: knee closer to midline than ankle by > 0.12 torso lengths — synthetic caving fixture (cave 0.2) fires, clean (cave 0) does not.
- EMA smoothing alpha 0.5 on phone-side landmarks.
- heel_raise: raise > 3% of leg length above a slowly-following floor baseline, release below 1.5%; 'Stand tall' at torso lean > 15 deg — synthetic fixtures (lift 0.08 counts, 0.015 does not).
- side_leg_raise: hip-to-ankle abduction > 20 deg up, < 8 deg back; 'Keep your body still' at torso tilt > 12 deg; only the chosen leg counts, outward only — synthetic fixtures (30 deg counts, 12 deg and the other leg do not).
- march: knee-to-hip drop under 50% of its learned standing drop = lift, back over 62% to re-arm; same knee twice in a row counts once; 'Hold the chair' when a wrist is 0.4 torso lengths above or 0.6 below hip height for 0.7 s — synthetic fixtures.
- tandem_hold: ankle x gap <= 0.3 shoulder widths = feet in line (SPEC said 0.08; too tight for a real camera, so tuned up); timer pauses when feet part; sway = hip x range over 1 s > 0.3 torso lengths -> 'Hold the chair, that's fine' (3 s cooldown) — synthetic fixtures (sway 0.25 amplitude fires, 0.01 does not).

## Blocked on user

- (none yet)

## Left for the human

- Real webcam + phone check (10 sit-to-stands)
- Record the 2:45 video (docs/DEMO.md)
- Friction log "what happened" column
- Make the GitHub repo public; submit on Devpost before Fri 12:00 PM PT
