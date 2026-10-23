# Progress

| Slice | Status | Proof (command + result) | Commit |
| --- | --- | --- | --- |
| S0 Walking skeleton | done | `npm run verify` exit 0, S0 PASS (7 checks); docs/screens/s0-tv.png, s0-phone.png; deployed WS echo + HTTPS page e2e | S0 |
| S1 Pairing | not started | | |
| S2 Live mirror | not started | | |
| S3 Rep engine: sit to stand | not started | | |
| S4 Session flow on TV | not started | | |
| S5 All five moves | not started | | |
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
- `npm run dev` is vite only for now; local server stand-in comes with S1 if needed.

## Tuned thresholds

- (move) value — fixture that proved it

## Blocked on user

- (none yet)

## Left for the human

- Real webcam + phone check (10 sit-to-stands)
- Record the 2:45 video (docs/DEMO.md)
- Friction log "what happened" column
- Make the GitHub repo public; submit on Devpost before Fri 12:00 PM PT
