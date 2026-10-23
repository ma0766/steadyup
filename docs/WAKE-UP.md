# Wake-up note

Plain words. Everything here was checked by running it.

## Where things stand

- **Main is updated and green, and verify was re-run on main itself.** The last full `npm run verify` on `main` (merged code, against the main stack) exited 0: every slice PASS, S9 53 checks, Lighthouse 100 on the main URL, rate-limit test included.
- **Details of the merge:** I merged `worldclass` into `main` after `npm run verify` exited 0 (every slice PASS, and the new S9 "world-class" slice with 53 checks). I deployed the main stack (same address as before: https://dh3aa2spgh07i.cloudfront.net), re-ran the S0 check against it (pass), and installed the new APK on the emulator. Tagged **submission-v2**.
- **Your safe copy is `submission-v1`.** To go back to exactly what you had at midnight: `git checkout submission-v1` (the cloud address never changed, so nothing else needs undoing). To put the old code back on the cloud, check out that tag and run `npm run deploy`.
- I tested everything first on a separate copy in the cloud (`SteadyUp-wc`). It is still there and costs nothing while idle. Delete it any time: `cd server && npx cdk destroy SteadyUp-wc -c stage=wc`.

## What changed (the 7 things you asked for)

1. **Judge audit.** A reviewer with no context read the README, demo script and screenshots and scored it (tech 7, design 6, impact 7, idea 7) and listed 10 weaknesses: `docs/AUDIT.md`. At the bottom is what I fixed and what I did not.
2. **It learns how each person moves.** Before the first set the TV asks for two slow stands, learns that person's sitting and standing levels, and counts with them. Tests: 3 body builds x 3 camera distances, all count 10 of 10. If it is unclear it asks again (three tries), then uses the standard levels. OK skips it.
3. **CDC 30-second chair stand check.** Home has a new button. First question: "Can you stand up from a chair without using your hands?" (No = skip). Optional age and sex. CDC's instructions, 3-2-1, 30 seconds, then the score with "CDC lists under N as below average for your age. Share this number with your doctor." using CDC's table. No diagnosis anywhere. The score is saved and the family page shows the trend. The README cites https://www.cdc.gov/steadi/ and the STEADI 30-Second Chair Stand form. (CDC's site blocked my automated link check, so I did not add a deep link to the PDF: check that the form is findable from the STEADI page.)
4. **Known gaps closed.** 5 wrong numbers a minute from one address, then a one-minute wait with a kind sentence. A set cut short with Back is saved with the reps really done. "Together" counts real reps. Names with accents work. Old rooms close and expire.
5. **Fire TV readiness.** Leanback launcher, 320x180 banner and icon, no touchscreen needed, a focus ring on every screen with buttons (checked by the tests on the emulator), Back always works, no Google Play services anywhere (scanned). With no voice on the TV, cues show larger.
6. **Quality bar.** Lighthouse accessibility 100 on the phone page; axe finds nothing serious on any page; 390 px with no sideways scroll; any console error fails a browser test; tech-word scans clean. Details: `docs/QUALITY.md`. A fresh reviewer checked every TV screenshot for text size, contrast, clipping and focus: `docs/TV-REVIEW.md` (I fixed the real problems it found, and noted that in the file).
7. **Demo and README.** `docs/DEMO.md` is 2:45 with the chair stand result as the impact moment. The README opens with a 3-line hook, has the sourced stats, a "Why Fire TV" section, and a "Where the code is" table.

Also: the Home screen is now a 2x2 grid (all four buttons fit), the live screen shows "Move N of M", a fill bar, and a banner with the cue, and the phone pages were redesigned (centred, camera guide outline, one instruction).

## What to test first (10 minutes)

1. **A real person, front-on.** Phone against a shelf, 2 m back, sturdy chair. Start today's 10 minutes: do the two slow stands, then 10 sit-to-stands. Does the count match yours? This is still the biggest unknown: every number so far comes from made-up body points and one back-view video.
2. **The chair stand check** with that same setup (chair without arms, arms crossed). Compare the score with what you count yourself.
3. Press through every screen with only the arrow keys, Enter and Esc.

## What is still not done

- No older adult has tried it, and no real Fire TV was used (emulator only). The emulator has no voice, so spoken cues were never heard.
- One guest per "move together" room.
- The pairing screen shows only the QR and the number (no web address, to keep to the no-tech-words rule). Typing by hand needs the address from the README; a short domain would make that friendlier.
- The demo history on the family page is seeded by `node scripts/seed-demo-history.mjs` (say so in the video description).

## Deadline reminders

Record the video from `docs/DEMO.md`, fill the "what happened" column in `FRICTION_LOG.md`, make the GitHub repo public, submit on Devpost before **12:00 PM PT / 3:00 PM ET today**.
