# Progress

| Slice | Status | Proof (command + result) | Commit |
| --- | --- | --- | --- |
| S0 Walking skeleton | done | `npm run verify` exit 0, S0 PASS (7 checks); docs/screens/s0-tv.png, s0-phone.png; deployed WS echo + HTTPS page e2e | S0 |
| S1 Pairing | done | `npm run verify` exit 0: S1 PASS (server unit: code, join, expired, reused, dead TV; Gradle reducer tests; e2e: Playwright phone joins with code read from adb logcat, TV screenshots docs/screens/s1-tv-code.png, s1-tv-connected.png) | S1 |
| S2 Live mirror | done | e2e: fake-camera y4m (real person) -> MediaPipe on phone page -> deployed relay -> TV figure (docs/screens/s2-tv-figure.png, two shots differ). Median phone->TV latency 82-85 ms, p95 ~110 ms (docs/LATENCY.md). Gradle S2MirrorTest (parse, smoother, mirror). | S2 |
| S3 Rep engine: sit to stand | done | vitest web/src/engine/s3-sit-to-stand.test.ts: 10/10 reps exact (jitter, near/far scale), 0 when out of frame or legs hidden, knee cue fires on caving fixture and not on clean; e2e recorder page saves landmark JSON from the fake camera | S3 |
| S4 Session flow on TV | done | e2e s4-session: scripted phone (Node ws; synthetic landmarks through the real sit-to-stand engine) drives a 3-move session on the emulator; screenshots docs/screens/s4-*.png (safety, home, intro, live, rest, finish, paused); TTS lines verified via logcat tag SteadyUpTts. Gradle S4SessionTest: machine, 5 s speech gate, plan caps, plain-words check. | S4 |
| S5 All five moves | done | vitest s5-moves (34 tests incl. 15-seed jitter sweep): positive, negative, low-confidence per move + every cue; e2e s5-full-session: default ten-set plan (all five moves, both sides) completes on the emulator, time-compressed (docs/screens/s5-*.png, s5-session-totals.txt) | S5 |
| S6 History and family page | done | e2e s6-history: finished session shows on the family page within 10 s of the finish screen (docs/screens/s6-family.png), TV This week screen with family QR (s6-tv-week.png), DynamoDB read by the test: only whitelisted count fields, zero items with landmark/pose attributes. Server unit: summary, streak, idempotent save, extra fields rejected. | S6 |
| S7 AI weekly plan | done | server/src/s7-plan.test.ts: mock model asking +10 reps/+10 s/+40 is capped to +2/+5/15/30 (sweep over every current value and ask), failures (throw, prose, wrong shape) keep the plan, plain-sentence guard; live smoke `node scripts/s7-smoke.mjs` PASS: real Bedrock plan via deployed API, valid and within caps; e2e s7-plan shows it on the family page | S7 |
| S8 Move together | done | e2e s8-together: (1) two scripted people through real engines: both labelled figures, separate reps, TV log together=6 for 3+3 (docs/screens/s8-tv-room.png, s8-tv-two-figures.png); (2) two fake-camera browser pages (Mom paired to the TV, Ana joined from her own phone page): TV shows both figures and a Together total (s8-tv-two-cameras.png). Server unit: rooms, tagging, broadcast, refusals. | S8 |
| S9 Submission pack | done | `bash scripts/clean-clone-check.sh`: fresh clone -> npm ci, npm test, APK built, Gradle tests pass; gitleaks: no leaks (12 commits); npm audit: 0 vulnerabilities; README, LICENSE (MIT), FEEDBACK.md, FRICTION_LOG.md, docs/DEMO.md, docs/MORNING-REPORT.md written | S9 |

## World-class pass (branch worldclass, stage wc) — started 00:25 ET Fri

| Item | Status | Proof |
| --- | --- | --- |
| Protect: tag submission-v1, branch worldclass, separate CDK stage `wc` | done | tag `submission-v1` pushed; stack `SteadyUp-wc` (`STAGE=wc npm run deploy`); main stack untouched until the end step. `config/endpoints.main.json` keeps the main URLs |
| 1 Fresh-eyes audit | done | docs/AUDIT.md (fresh subagent, 10 ranked weaknesses) plus a status table of fixes |
| 2 Personal calibration | done | web/src/engine/calibration.ts + s2b-calibration.test.ts: 3 builds x 3 distances, each calibrates from 2 slow reps then counts 10/10; unclear -> retry -> defaults; TV Calibrate screen; e2e s9-worldclass (unclear try repeats, then counts) and real phone page answers `calibrate` |
| 3 CDC chair stand | done | engine chairStand.ts, TV flow (question, optional age/sex, instructions, 3-2-1, 30 s, result with CDC number), score saved, family trend; Kotlin S9WorldClassTest (table, exact wording, no diagnosis words); e2e screenshots docs/screens/s9-chair-*.png |
| 4 Known gaps | done | rate limit (5 wrong/min/address, 1 min wait; unit + live e2e), Back saves actual reps, Together counts actual reps, unicode names, rooms close/expire (30 min TTL) |
| 5 Fire TV readiness | done | tests/unit/s9-fire-tv.test.ts (leanback, banner 320x180, touchscreen not required, only INTERNET), `scripts/check-no-play-services.sh` in verify, focus ring asserted by `waitScreen` on every button screen via uiautomator, Back test over all screens, cues larger with no voice |
| 6 Quality bar | done | axe (serious/critical none) on phone, together, family, recorder; 390 px no sideways scroll; console errors fail any browser test; tech-word scan of TV strings and phone pages; Lighthouse accessibility 100 on the phone page (`scripts/lighthouse-a11y.sh`); subagent TV screenshot review below |
| 7 Demo and README | done | docs/DEMO.md (2:45, chair stand as the impact moment), README (3-line hook, sources, Where the code is) |

**End step (done):** `npm run verify` exit 0 on worldclass (all slices PASS, S9 53 checks, Lighthouse 100) -> merged to main (no-ff) -> main stack deployed (same URLs as before) -> S0 check re-run against it: 2 passed -> APK installed on the emulator with main endpoints -> chair stand flow re-run end to end against the main stack -> tag submission-v2. Then, on main: `npm run verify` exit 0 again (all slices PASS, S9 53, Lighthouse 100 on the main URL); measured TV text-size check added (UI tree, under 90 px fails); fresh reviewer re-checked every final TV screenshot (29 PASS / 3 BORDERLINE / 0 FAIL) and the small fixes after it were re-verified by a last full run. Tag submission-v2 moved to the final commit. Roll back: `git checkout submission-v1`. Wake-up note: docs/WAKE-UP.md.

**Final chair stand screenshots, checked by eye after the last green verify on main (files timestamped 07:20-07:21):** s9-chair-1 question with a focus ring on Yes; s9-chair-2 age 65 to 69 and sex Woman with the "Press OK to change a choice." hint and a ring on the focused row; s9-chair-3 the six CDC instruction lines with "I'm ready" focused; s9-chair-4 timer in seconds, live count 8, banner; s9-chair-5 score 12, "CDC lists under 11 as below average for your age." (the CDC number for a woman aged 65 to 69), "Share this number with your doctor.", and a labelled focused "Back to start" button; s9-chair-no the skip sentence with a focused button. Nothing clipped or overlapping. The text-size floor is also measured by the e2e run on each of these screens (no text node under 90 px tall). The chair screens did not change after the last fresh-reviewer pass (only the pairing and week screens went from 40 sp to 44 sp).

**Last round (08:00-08:35):** a stricter measurement (92 px) found the chair result button label clipped; fixed by a compact layout. Final `npm run verify` on main: exit 0, all slices PASS, S9 53, Lighthouse 100, 133 unit tests. Measured smallest TV text per screen: docs/text-sizes.json (min 94 px, 40 sp = 93 px). `submission-v1` tag is on the remote (a725207). `submission-v2` moved to the final commit.

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
- S6: history goes TV -> HTTPS API (POST /sets, retried) rather than through the phone relay, so it works whatever the phone does. Schema is strict (zod .strict()): any extra field such as landmarks is rejected with 400, not stored.
- S6: the household id is 32 random hex chars kept on the TV; it is the secret inside the family link (QR on the TV This week screen). No accounts.
- S6: summary 'today' = later of the page's local date and the newest recorded day, so phone/TV time-zone differences never hide a session.
- S6: sessions = distinct session ids with at least one finished set; sets are saved as they finish (partial sessions count).
- S7: model = Bedrock `us.anthropic.claude-haiku-4-5-20251001-v1:0` (Converse). anthropic.claude-haiku-5-5 is access-denied for this account. IAM limited to InvokeModel on Haiku 4.5 ARNs.
- S7: caps in code: +-2 reps, +-5 s, max 15 reps / 30 s, plus a floor of 4 reps / 10 s that never raises anyone already below it. Model sentence kept only if plain (under 12 words, no tech words), else code writes 'Let's try 10.'
- S7: only a successful model call is stored; any failure returns the current plan unchanged.
- S7: TV loads targets at start and after Finish; they land only between sessions (machine.updatePlan). A fixed `plan` test extra ignores them.
- S8: Move together = a room on the host TV (6-digit number, 1 hour). Family joins from their own phone page (together.html) with their own camera, so one emulator is enough for the proof. The relay tags guest messages `guest:true,name` so the TV never mixes them with its own phone; the TV does not ack guest poses; the TV broadcasts each move/set-end to guests so their phone counts the same move.
- S8: Together total = my finished reps + my live count + the guest's finished and live reps. Only body points and counts cross the relay; guests' video never leaves their phone. A second real TV joining a room is not built (the spec allowed one emulator with a split view).
- S9: spoken cues cannot be heard on the Android TV emulator (no speech engine, `engine ready=false`); verified by logs and unit tests and disclosed in README and the morning report.
- S9: rejected review nits left open on purpose (logged in the morning report): no attempt limit on pairing numbers, one guest per room, Back mid-set not saved, ASCII-only guest names. (World-class pass FIXED all but one guest per room.)
- WC: calibration bands = seated + 28% / 62% of the person's own seated-to-standing range (gap = hysteresis); needs 2 clear cycles and a range of at least 0.35 torso lengths; 3 unclear tries then defaults. The TV never blocks on it (Skip with OK).
- WC: chair stand counts each FULL STAND (CDC: count a stand when fully up); one reminder 'Cross your arms on your chest' if the wrists hang. CDC compare line needs both age band and sex; otherwise a generic CDC line. Never a verdict.
- WC: chair stand scores are stored as sets with move chair_stand_30 (target 30, done = stands) and kept out of sessions, streaks and totals.
- WC: wrong-number limiter is per source address (API Gateway sourceIp), stored in DynamoDB with TTL; only wrong tries count.
- WC: Home is a 2x2 grid (all four buttons fit at 1080p). Arrow keys: Start | Move together over This week | Chair stand check.
- WC: MediaPipe's INFO line on the console error stream is ignored by the console-error check (not an app error).
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

- Real webcam + phone check (10 sit-to-stands); read docs/MORNING-REPORT.md first
- Record the 2:45 video (docs/DEMO.md)
- Friction log "what happened" column
- Make the GitHub repo public; submit on Devpost before Fri 12:00 PM PT
