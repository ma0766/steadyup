# TV screenshot accessibility review

Method: each PNG (1920x1080, 320 dpi, so 40 sp = 80 px) was viewed. Sizes are estimates from glyph heights read off the image (capital height is about 0.71 of font size, so 80 px = about 57 px cap height), error about +/- 4 px. Contrast was judged from the visible colours: white, light blue, yellow and green text on near-black navy; dark navy text on blue or light-blue buttons. All pairs I saw are well above 4.5:1 (roughly 6.5:1 for dark text on the unfocused blue button, 12:1 or more elsewhere). The grey progress track is about 3.5:1 against the background, which is fine for a non-text shape. No text was clipped or overlapping in any screenshot.

Verdict rule: PASS = smallest text estimated at 86 px or more. BORDERLINE = smallest text within about 4 px of 80. FAIL = clearly under 80. Nothing is FAIL.

| File | Screen | Text size | Contrast | Clipping | Focus ring | Note |
| --- | --- | --- | --- | --- | --- | --- |
| s0-tv | Splash | PASS (smallest "Your balance coach", about 84-86 px) | OK | none | no buttons | Clean. |
| s1-tv-code | Pairing QR + number | BORDERLINE (smallest "Or type this number:", about 80 px; address about 95 px) | OK | none, but the address wraps as "...cloudfront." / "net" | no buttons | Address is hard to read and type, and shows a tech word ("cloudfront"). Code digits are large. |
| s1-tv-connected | Connected | PASS (smallest "Your phone is ready.", about 95 px) | OK | none | no buttons | Clean. |
| s2-tv-figure | Live set, 1 of 8 | PASS (smallest "Move 1 of 10", about 87 px) | OK | none | no buttons | Figure is small and low on the left; text is fine. |
| s4-1-safety | First-run safety | PASS (smallest button label "I understand", about 100 px) | OK | none | visible | Good. |
| s4-2-home | Home, 4 tiles | PASS (smallest "Good to see you.", about 87 px) | OK | none; "Start today's 10 minutes" wraps to 2 lines, fits | visible (Start) | One focused tile, clear. |
| s4-3-intro | Move intro, Sit to stand | PASS (smallest "Stand up slowly. Then sit back down.", about 85-87 px) | OK | none | visible (I'm ready) | "Hold the back of the chair." wraps with a one-word second line ("chair."). |
| s4-4-live | Live set, 0 of 3 | PASS (smallest "of 3" and "Step back..." line, about 90 px) | OK | none | no buttons | Shows "Step back so I can see your whole body." and the cue "Keep knees over toes" at the same time with count 0: two contradictory messages. |
| s4-5-rest | Shows the Heel raises intro, not Rest | PASS (smallest "Rise up on your toes...", about 87 px) | OK | none | visible (I'm ready) | Wrong screen for its name; identical to s4-6. No Rest screen is proven. |
| s4-6-intro-heel | Move intro, Heel raises | PASS (about 87 px) | OK | none | visible (I'm ready) | Fine. |
| s4-7-live-heel | Live set, Heel raises, 2 of 3 | PASS (smallest "Move 2 of 3", about 87 px) | OK | none | no buttons | Clean. |
| s4-8-finish | Shows Home, not Finish | PASS (smallest "Good to see you.", about 87 px) | OK | none | visible (Start) | Wrong screen for its name; duplicate of s4-2. Finish proof is s5-finish / s9-finish. |
| s4-9-paused | Paused | PASS (smallest "OK", about 95 px bold; message about 115 px) | OK | none | visible (OK) | Message wraps with a one-word line ("ready."). |
| s5-finish | Finish totals, 5 moves | PASS (smallest "See you tomorrow.", about 90 px) | OK | none | visible (Back to start) | Dense: right column wraps to 5 lines ("Foot in front (seconds): 40"), only about 30 px above "See you tomorrow." Label "(seconds)" and "Foot in front" are awkward. |
| s5-intro-2 | Move intro, Leg out, left | PASS (smallest "Lift one leg out to the side.", about 87 px) | OK | none | visible (I'm ready) | Title wraps to 2 lines, fits. |
| s5-intro-4 | Move intro, March in place | PASS (about 87 px) | OK | none | visible (I'm ready) | Fine. |
| s5-intro-5 | Move intro, Foot in front | PASS (about 87 px) | OK | none | visible (I'm ready) | Fine. |
| s5-live-hold | Live hold timer, 8 of 20 seconds | PASS (smallest "Move 6 of 10", about 87 px) | OK | none | no buttons | Clean. |
| s6-tv-week | This week + family QR | BORDERLINE (smallest "Family can scan this." about 77-80 px, "Last time:" about 80 px) | OK | none; but only about 30 px between "Heel raises: 3" and the button | visible (Back to start) | "You exercised once this week." wraps with a one-word second line. Left column is crowded. |
| s8-tv-room | Move together room code + QR | PASS (smallest "Family can join with this.", about 85 px) | OK | none | visible (Start together) | Clear. |
| s8-tv-two-cameras | Together live, Together: 0 | PASS (smallest "You"/"Ana" labels and "Move 1 of 1", about 85-88 px) | OK | none. "Together: 0" sits in the header row and is whole, with about 100 px right margin. "You"/"Ana" labels end about 20 px above the cue box (tight, not touching). | no buttons | Total is readable. |
| s8-tv-two-figures | Together live, Together: 2 | PASS (same as above) | OK | none. "Together: 2" whole. Labels about 20 px above the cue box. | no buttons | Cue "Keep knees over toes" is bold yellow, clear. |
| s9-calibrate | "Let's try once more" | PASS (smallest "Stand up slowly, then sit down.", about 87 px; Skip about 92 px) | OK | none | visible (Skip) | Skip is a small button but the label is whole. |
| s9-chair-1-question | Chair check question | PASS (smallest "Chair stand check", about 90 px) | OK | none | visible (Yes focused, No not) | Good. |
| s9-chair-2-about | Optional age / sex | PASS (smallest "Press OK to change a choice.", about 84-86 px; buttons about 88 px) | OK | none | visible (Sex: Woman) | No title, so it is unclear what the screen belongs to. "score." sits alone on line 2. |
| s9-chair-3-how | Chair check how-to, 6 lines | BORDERLINE (smallest lines about 82 px) | OK | none | visible (I'm ready) | Six sentences, each under 12 words, but a wall of text for this audience. |
| s9-chair-4-go | Chair check timer | PASS (smallest "stands", about 90 px) | OK | none | no buttons | Clean. Timer "18 seconds" is in the header. |
| s9-chair-5-result | Chair check score | PASS (smallest "CDC lists..." lines, about 88 px) | OK | none. The "Back to start" button has a full label and sits about 40 px below the last text line, about 70 px above the screen bottom. | visible (Back to start) | "CDC" is a jargon word; the sentence wraps with the one word "age." on line 2. |
| s9-chair-no | Skipped the check | PASS (smallest "Back to start", about 95 px; message about 100 px) | OK | none | visible (Back to start) | Friendly and short. |
| s9-finish | Finish, sit to stand | PASS (smallest "See you tomorrow.", about 90 px) | OK | none | visible (Back to start) | Clean. |
| s9-home-grid | Home, 4 tiles | PASS (smallest "Good to see you.", about 87 px) | OK | none | visible (Start) | Tiles stay the same size when focused. |
| s9-live-midset | Live set, 7 of 8 | PASS (smallest "Move 1 of 1", about 87 px) | OK | none | no buttons | Cue is bold and readable. "Move 1 of 1" is an odd label. |

Counts: 32 screenshots. PASS 29, BORDERLINE 3, FAIL 0.

## Real problems, most serious first

1. Two screenshots show the wrong screen. `s4-5-rest.png` is a Heel raises intro and `s4-8-finish.png` is Home. No Rest screen is shown in any reviewed file, so Rest has no visual proof. The Finish screen is covered only by s5-finish and s9-finish.
2. `s4-4-live` shows two conflicting messages at once: "Step back so I can see your whole body." and "Keep knees over toes", with the count at 0. Show one message only (the step-back one should win).
3. `s1-tv-code`: the typed-fallback address breaks across two lines ("cloudfront." / "net") and shows a tech word. The "Or type this number:" line is about 80 px, right at the limit. A short address on one line would help.
4. Text margin is thin on the secondary lines. Many light-blue lines measure about 84-87 px, and three screens measured at or just under the limit (s1-tv-code, s6-tv-week "Family can scan this." about 77-80 px, s9-chair-3-how about 82 px). These probably render at exactly 40 sp, which meets the rule only if the estimate error is in our favour. Raising secondary lines to 44 sp would remove the doubt.
5. Crowded layouts: s5-finish (5-line right column, "Foot in front (seconds)" is an odd label) and s6-tv-week (lines about 30 px above the button). Fits today, but breaks if a plan adds one more move or a longer sentence.
6. One-word orphan lines: "chair." (intro screens), "ready." (s4-9), "week." (s6), "age." (s9-chair-5), "score." (s9-chair-2). Cosmetic, but harder to read for older eyes.
7. s9-chair-2-about has no screen title; "CDC" on s9-chair-5-result is a jargon word (the plain-words rule says no tech words; this is an organisation name, so judgment call).
8. s9-chair-3-how is six lines of text on one screen. All sentences are short, but one idea per screen would suit this audience better.

Not found: low contrast, clipped or empty buttons, overlapping text, a missing focus ring, or any cut-off "Together: N" total on s8-tv-*. Focus on every screen with buttons is a thick white border (about 16 px, 8 dp) with a lighter fill, on exactly one button.
