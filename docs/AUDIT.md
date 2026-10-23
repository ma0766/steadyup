# SteadyUp: judge audit

**Verdict:** A thoughtful, well-scoped idea with clean TV screens, but the proof it works on a real person is missing, and the screenshots show a barbell back-squat instead of an older adult on a chair.

## Scores (out of 10)

| Part | Score | Why |
| --- | --- | --- |
| Technical implementation | 7 | Phone pose tracking, cloud relay, a native TV app, Bedrock plan with code-enforced caps and tests is a real full stack, but the README admits thresholds were tuned on synthetic data and a back-view squat. |
| Design | 6 | TV screens are big, high contrast and plain-language, but the phone pages are tiny and left-aligned, the Home screen has a blank clipped button, and the live screen is sparse. |
| Potential impact | 7 | Falls in older adults are a real and well-cited problem, and zero-hardware is a strong angle, but nothing shows an actual 72-year-old using it. |
| Quality of the idea | 7 | Phone-as-camera plus TV-as-coach plus family view fits Fire TV well, but it is a known pattern (Peloton Guide, Halo) and the "why Fire TV" story is thin. |

## The 10 biggest weaknesses (most damaging first)

### 1. No evidence of a real person doing a real chair exercise
- **What a judge sees:** The phone screenshots (`s2-phone-live.png`, `s8-ana-phone.png`) show a man doing a barbell back squat in a gym, labelled "SQUAT". The TV figure in `s2-tv-figure.png` is a back-view, stooped skeleton at "0 of 8". README "Honest limits" says counts were tuned on synthetic streams and "one real exercise video (a back-view squat)".
- **Why it costs points:** The whole product claim is "it counts and coaches an older adult's chair moves". Nothing visible proves that. It reads as a demo of fake data.
- **Fix (under 2 hours):** Record 60 seconds of a real person doing sit to stand at the chair, front-on. Save a screenshot of the TV with a rep count above 0, and use that clip in the demo video and README. Replace the squat images in `docs/screens/`.

### 2. Screenshots mostly show "0" or scripted runs
- **What a judge sees:** The live screens show "0 of 8", "0 of 3", "Together: 0". The "Finish" screen shows 3, 3, 3 for three moves. Everything looks like test output.
- **Why it costs points:** It undermines the technical score. A judge cannot tell whether the counting works in practice.
- **Fix:** Re-shoot the key screens (live set, finish, together) mid-set with non-zero counts, and caption them in README with the real source (laptop webcam).

### 3. Home screen has a blank, clipped third button
- **What a judge sees:** In `s4-2-home.png` there are three buttons: "Start today's 10 minutes", "Move together", and a third pill at the bottom with no label, cut off by the screen edge. The README and demo say Home has "This week" there.
- **Why it costs points:** It looks broken on the very first screen a judge sees, and it hides the "This week" entry. It also breaks the spec's one-main-action rule.
- **Fix:** Shrink the heading and button heights or put the buttons in a scrollable column so all three fit at 1080p. Re-shoot `s4-2-home.png`.

### 4. Phone pages look unfinished
- **What a judge sees:** `s1-phone-connected.png` is a dark page with only "SteadyUp" and "Connected" in one narrow left column. `s2-phone-live.png` has a thumbnail-sized camera preview (about 160 px wide) and a bare "0". `s1-phone-wrong.png` shows the code box as plain "000000" with no layout polish.
- **Why it costs points:** The phone is half the product and half the design score. It reads as a developer test page. It also gives the person no guidance such as "step back" or a framing outline.
- **Fix:** Center the column, make the camera preview full width with a body outline guide, and add one instruction line ("Lean the phone on a shelf. Stand 2 steps back."). Re-shoot the phone shots.

### 5. Live screen is too sparse for an exercise coach
- **What a judge sees:** `s4-4-live.png` and `s5-live-hold.png` show a small stick figure on the left and a giant number on the right. No progress ring, no "Stand up / Sit down" prompt, no set or move progress ("Move 2 of 5"), no rest countdown shown in the shots. The figure takes up a thin strip.
- **Why it costs points:** For a "multi-modal UX" and design score, this is the main screen and it feels like a counter, not a coach. The cue ("Keep knees over toes") appears in tiny contrast at the bottom.
- **Fix:** Enlarge the figure, add a one-line move prompt and "Move 1 of 5" at the top, and a simple fill bar for reps. Show the cue in a banner.

### 6. The demo script and the app disagree
- **What a judge sees:** `docs/DEMO.md` promises "4 sessions this week. Up from 2." and "You did 8 every day. Let's try 10." The shipped screenshots show "1 session this week. Up from 0." (`s6-family.png`) and "Let's try 9." (`s7-family-plan.png`, which also shows an unrealistic "7 sessions, 7 days in a row"). The demo needs `scripts/seed-demo-history.mjs` to reach those numbers.
- **Why it costs points:** The reader senses staged data. The demo relies on seeded history, and the README does not say so.
- **Fix:** Either seed history for the demo and disclose it in one line in DEMO.md and README, or change the script lines to the real numbers. Make plan screenshots match the script.

### 7. Spoken coaching is never demonstrated
- **What a judge sees:** README and DEMO both admit "spoken cues are silent on the emulator". The cue only appears as text. The README lists "voice" in the architecture diagram.
- **Why it costs points:** Voice is the key multi-modal feature for a lean-back TV coach for older adults, and the video cannot show it. A judge cannot verify it.
- **Fix:** Install a text-to-speech engine on the emulator image, or record the cue with a Fire TV Stick or a physical Android TV. At minimum add a short audio clip or captioned voiceover to the demo video showing the spoken line.

### 8. Not tested on any real Fire TV, and the Fire TV angle is thin
- **What a judge sees:** README: "Tested on the Android TV emulator, not on a physical Fire TV device." The TV uses a standard Android TV layout. Nothing mentions Fire TV remote specifics, Alexa voice, Fire OS launcher, or the Appstore.
- **Why it costs points:** This is the Fire TV track. A judge asks "why Fire TV, not any Android TV?" and finds no Fire-specific feature.
- **Fix:** Sideload on a Fire TV Stick if one is available and add one photo. Add a short README section "Why Fire TV" (the cheap stick in the living room, the remote-only flow, possible Alexa hook) and list Fire TV remote behaviour that was handled.

### 9. Pairing screen exposes a raw URL and asks for typing
- **What a judge sees:** `s1-tv-code.png` shows a QR, "255 580", and the text "dh3aa2spgh07i.cloudfront.net". The persona "Mom" is meant to never type, yet the fallback needs a phone user to type a URL and a 6-digit number.
- **Why it costs points:** It breaks the app's own "no tech words" rule on the first screen and the address looks like a temporary demo host. It also makes the first-run feel clunky.
- **Fix:** Hide the long URL behind the QR (show only a short readable address) and register a short domain or at least a friendlier subdomain. Keep the number as backup.

### 10. Impact claims lean on cited stats, with no user evidence or business path
- **What a judge sees:** README opens with CDC and Cochrane numbers. There is no quote from an older adult, no test with anyone, no pricing or distribution plan, and no mention of what happens after the hackathon. The disclaimer repeats that it is not medical.
- **Why it costs points:** Impact is scored equally. The stats show the problem is large, but not that SteadyUp solves it. The "Honest limits" section, while honest, lists what is not done and ends with "See MORNING-REPORT" as if unfinished.
- **Fix:** Get 2 or 3 people (ideally 65+) to try it for 5 minutes and add one quote and a photo to the README. Add a 3-line "Next" section covering the Appstore listing and a free-for-family model. Replace the internal MORNING-REPORT pointer with a clear known-issues list.
