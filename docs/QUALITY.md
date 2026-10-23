# Quality bar results (worldclass branch)

Run by `npm run verify` (last run: exit 0, every slice PASS, S9 53 checks). Pages tested at **390 px wide**.

| Check | Result | How |
| --- | --- | --- |
| axe: no serious or critical issues | PASS on the phone join page (and its live view), the "move together" page, the family page (bad link and real data) and the recorder | `tests/e2e/s9-quality.spec.ts` (`@axe-core/playwright`) |
| Lighthouse accessibility, phone page | **100** (needed 95+) | `scripts/lighthouse-a11y.sh` (Lighthouse 12, mobile, 390x844) |
| 390 px, no sideways scroll | PASS on all five pages | same spec: `scrollWidth <= clientWidth` |
| Zero console errors in e2e | PASS: every browser page opened by a test fails the test if it logs a console error or an uncaught error (MediaPipe's own "INFO: Created TensorFlow Lite XNNPACK delegate" line is ignored, it is not an error) | `tests/phone.ts` |
| Banned tech words | PASS: scan of visible text on the phone pages (`s9-quality.spec.ts`), of every string literal in the TV screens, plan and CDC files (`tests/unit/s9-words.test.ts`), and of every `Sentences` line (Kotlin tests) | words: landmark, websocket, sync, api, error code, server, pose |
| TV text at least 40 sp | PASS in code: every `fontSize` / `fontSp` / cue size in `Screens.kt` is >= 40 | `tests/unit/s9-words.test.ts` |
| TV text size, contrast, clipping on real screenshots | see `docs/TV-REVIEW.md` (a reviewer with no context looked at every TV screenshot) | emulator 1920x1080 at 320 dpi (40 sp = 80 px) |
| D-pad focus visible on every button screen | PASS: `waitScreen` in the e2e helpers asks the TV for its UI tree and fails if nothing is focused on safety, home, week, together, calibrate, the chair screens, paused, rest, intro, finish | `tests/tv.ts` (uiautomator) |
| Back always works | PASS: unit test walks every screen; Back returns Home (Home and the first safety screen leave Back to the system) | `S9WorldClassTest.backNeverLeavesYouStuck` |
| No Google Play services | PASS: none in the debug or release runtime dependency tree | `scripts/check-no-play-services.sh` |
| Fire TV manifest | PASS: leanback launcher, 320x180 banner on the app and the activity, touchscreen not required, only the INTERNET permission | `tests/unit/s9-fire-tv.test.ts` |
| Secrets | gitleaks: no leaks | `gitleaks detect` |
| Dependencies | `npm audit`: 0 vulnerabilities | `npm audit` |
| Clean clone | fresh clone: `npm ci`, `npm test`, APK build, Gradle tests all pass | `scripts/clean-clone-check.sh` |
