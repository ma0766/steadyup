# TV accessibility review

Reviewed by eye from the 1920x1080 screenshots (density 2.0, so 40 sp = 80 px). No code was run and no pixels were measured by tool. Text-size figures are estimates from visible cap heights (Roboto cap height is about 0.71 of the font size), good to roughly +/- 4 px. "Borderline" means my estimate is 78 to 82 px, so it could be on either side of 80. Confirm those in code, not from this review.

Contrast: every pairing seen is well above 4.5:1. White, light blue (#BFD7EA-ish), green and amber on near-black navy are all about 10:1 or better. Dark text on the mid-blue button (#5FA8D3-ish) is about 7:1. Dark text on the pale focused button is about 12:1.

## Per screenshot

| File | Screen | Text size | Contrast | Clipping | Focus ring | Note |
| --- | --- | --- | --- | --- | --- | --- |
| s0-tv.png | Splash: SteadyUp + tagline | PASS (smallest: tagline, ~83 px) | PASS | none | no buttons | Clean. |
| s1-tv-code.png | Pairing: QR, code, web address | FAIL (smallest: web address line ~76 px; "Or type this number:" ~80 px borderline) | PASS | none | no buttons | The address `d3ltiulf1p49il.cloudfront.net` is a tech word a user can see and is small. |
| s1-tv-connected.png | First-run safety (not a "Connected" screen) | PASS (smallest: "I understand" button ~88 px) | PASS | none | visible | File name does not match the content. It shows the safety screen, so the "Connected" proof is missing. |
| s2-tv-figure.png | Live set, Sit to stand 0 of 8 | PASS (smallest: "Move 1 of 10" ~78 px, borderline) | PASS (progress track is faint, see problems) | none; cue panel bottom is 32 px from the edge | no buttons | Header is the weakest text on every live screen. |
| s4-1-safety.png | First-run safety | PASS (smallest: button ~88 px) | PASS | none | visible | Plain, short sentences. |
| s4-2-home.png | Home: 4 buttons | PASS (smallest: "Good to see you." ~84 px) | PASS | none | visible (on "Start today's 10 minutes") | Focus ring touches the "Move together" button. The grid is ragged: row 1 is left-aligned and row 2 is centered. |
| s4-3-intro.png | Move intro: Sit to stand | PASS (smallest: instruction ~84 px) | PASS | none | not visible | "I'm ready" has no focus ring. A line wraps with the orphan word "down." |
| s4-4-live.png | Live set with cue "Keep knees over toes" | PASS (smallest: "Move 1 of 3" ~78 px, borderline) | PASS | none; cue panel bottom is 32 px from the edge | no buttons | Cue is large and clear. Panel is inside the 5% TV safe margin. |
| s4-5-rest.png | Shows the Heel raises intro, not Rest | PASS (smallest: instruction ~84 px) | PASS | none | not visible | Not a Rest screen. The Rest screen has no screenshot. |
| s4-6-intro-heel.png | Move intro: Heel raises | PASS (smallest: ~84 px) | PASS | none | not visible | Same as s4-3. Wrap leaves "lower slowly." on line 2, fine. |
| s4-7-live-heel.png | Live set, Heel raises 2 of 3 | PASS (smallest: header ~78 px, borderline) | PASS | none; cue panel 32 px from edge | no buttons | Progress bar is readable once filled. |
| s4-8-finish.png | Shows Home, not Finish | PASS (smallest: ~84 px) | PASS | none | visible | Not a Finish screen, content duplicates s4-2-home. |
| s4-9-paused.png | Paused: "Press OK when you're ready." | PASS (smallest: OK button ~90 px) | PASS (amber on navy) | none | visible | The sentence wraps and leaves "ready." alone on line 2. |
| s5-finish.png | Finish: "Well done!" and six totals | PASS (smallest: "See you tomorrow." ~84 px; totals ~84 px) | PASS | none; button bottom edge is 52 px from the bottom, tight vs overscan | visible, but button is EMPTY | The button has no label. A focused, empty button is the worst defect in this set. |
| s5-intro-2.png | Move intro: Leg out to the side, left | PASS (smallest: instruction ~84 px) | PASS | none | not visible | Title wraps and leaves "left" alone. |
| s5-intro-4.png | Move intro: March in place | PASS (smallest: ~84 px) | PASS | none | not visible | Good. |
| s5-intro-5.png | Move intro: Foot in front | PASS (smallest: ~84 px) | PASS | none | not visible | Good. |
| s5-live-hold.png | Live hold, 8 of 20 seconds | PASS (smallest: header ~78 px, borderline) | PASS | none; cue panel 32 px from edge | no buttons | Good. |
| s6-tv-week.png | This week + family QR | PASS (smallest: "Last time:" ~78 px, borderline; list rows ~82 px) | PASS | none | not visible | "Back to start" shows no focus ring. Text column is dense for one screen. |
| s8-tv-room.png | Move together: room code + QR | PASS (smallest: "Family can join with this." ~82 px) | PASS | none | not visible | "Start together" shows no focus ring. |
| s8-tv-two-cameras.png | Together live: You and Ana (both moving) | PASS (smallest: header ~78 px borderline; "You"/"Ana" labels ~78 px borderline) | PASS | none; "You"/"Ana" sit 20 px above the cue panel, tight but not overlapping | no buttons | Figures are small. Two colors plus names helps. |
| s8-tv-two-figures.png | Together live, cue shown, "Together: 2" | PASS (smallest: header ~78 px borderline; labels ~78 px borderline) | PASS | none; labels tight above cue panel | no buttons | Same layout as above. |
| s9-calibrate.png | "Let's try once more" + 0 of 2 | PASS (smallest: instruction ~84 px; "Skip" ~80 px borderline) | PASS | none; bottom of Skip is 74 px from the edge | not visible | "Skip" has no focus ring. Wrapped lines are fine. |
| s9-chair-1-question.png | Chair stand check: Yes / No | PASS (smallest: "Chair stand check" ~80 px, borderline) | PASS | none | visible (on "Yes") | One 11-word question. Good. |
| s9-chair-2-about.png | Optional age / sex picker + Next | PASS (smallest: button text ~88 px) | PASS | none | visible (on "Sex: Woman") | "Age: 65 to 69" and "Sex: Woman" look like fixed labels, not choices. Nothing says "press OK to change". |
| s9-chair-3-how.png | Chair stand check: how to do it | PASS (smallest: lines ~82 px, borderline) | PASS | none; margins are fine | not visible | Six short lines, none over 10 words. Good plain language. Button has no ring. |
| s9-chair-4-go.png | Chair stand live: 21 s, 8 stands | PASS (smallest: "stands" ~90 px; header ~85 px) | PASS | none; cue panel 32 px from edge | no buttons | Good. |
| s9-chair-5-result.png | Result: score 12, CDC line | PASS (smallest: CDC lines ~80 px, borderline) | PASS | none; left/right margin about 83 px | visible | "CDC lists under 11 as below average" is the longest text here and uses an acronym. |
| s9-chair-no.png | "That's okay. We'll skip this check." | PASS (smallest: button ~88 px) | PASS | none | not visible | "Back to start" has no focus ring. |
| s9-finish.png | Finish: Sit to stand 8 | PASS (smallest: "Sit to stand: 8" ~84 px) | PASS | none | visible | Good. Label is present on the button, unlike s5-finish. |
| s9-home-grid.png | Home: 4 buttons | PASS (smallest: "Good to see you." ~84 px) | PASS | none | visible | Identical to s4-2. Focus ring still touches "Move together". |
| s9-live-midset.png | Live set 7 of 8 with cue | PASS (smallest: header ~78 px, borderline) | PASS | none; cue panel 32 px from edge | no buttons | Good. |

## Counts

- Text-size verdict: **31 PASS, 1 FAIL** (32 screenshots).
- About 12 of the 31 PASS rows contain text I rate borderline (78 to 82 px).
- Other defects (not in the text-size count): 1 empty button (s5-finish), 11 screens where the only button shows no focus ring, 3 screenshots whose name does not match the screen shown.

## Real problems, most serious first

1. **s5-finish.png: the focused button has no label.** A person using the remote sees a blank pill and does not know what OK does. Fix: set the label ("Back to start") or find why the text is missing (likely text colour equal to the focused fill, or an empty string on this screen path).
2. **Single-button screens show no focus ring** (s4-3, s4-5, s4-6, s5-intro-2/4/5, s6-tv-week, s8-tv-room, s9-calibrate, s9-chair-3, s9-chair-no). With one button the user cannot tell it is pressable. Fix: request focus on the primary button when the screen appears (`LaunchedEffect` plus `FocusRequester`) so the 6 dp white ring always shows. The intro "I'm ready" screens matter most, since they gate every set. Note the emulator capture may have been taken before focus was granted, so confirm on a rerun.
3. **Evidence does not match file names.** s1-tv-connected shows the safety screen, s4-5-rest shows the Heel raises intro, s4-8-finish shows Home. The "Connected", Rest and Finish screens for the S1 and S4 slices therefore have no valid proof here, and I could not review the Rest screen at all. Fix: recapture these three, or rename and add the missing shots.
4. **s1-tv-code.png: web address line is a tech word and the smallest text in the set (~76 px).** "d3ltiulf1p49il.cloudfront.net" breaks the "no tech words" rule and is below 80 px. Fix: drop it from the TV (the QR and the 6 digits are enough) or show a short friendly line such as "Or go to the web page on your phone's browser"; if it must stay, raise it to at least 40 sp.
5. **"Move N of M" header and "You"/"Ana" labels are borderline (~78 px).** They sit on every live screen. Fix: set them to at least 44 sp so they clear 80 px with margin; do not rely on this review to confirm exact sizes.
6. **Live-screen content sits inside the overscan margin.** The cue panel ends 32 px from the bottom edge and the header starts about 50 px from the top; s5-finish's button ends 52 px from the bottom. Many TVs crop 3 to 5% (about 32 to 54 px). Fix: add at least 54 px safe padding on all edges (about 27 dp).
7. **Home grid is ragged and the focus ring touches a neighbour** (s4-2, s9-home-grid). Row 1 is two unequal buttons running to the left edge, row 2 is centred, and the ring on "Start today's 10 minutes" touches "Move together". Fix: use equal-width buttons in a 2x2 grid with at least 24 dp gaps, or a single vertical list (best for arrow-key navigation).
8. **Progress track is almost invisible when empty** (s2, s4-4, s8). The empty bar (#2B3B4D on #111820) is about 1.5:1. It is not text, but at 0 progress it looks like a missing element. Fix: lighten the track or add a 2 dp outline (3:1 is the non-text target).
9. **s9-chair-5-result: "CDC lists under 11 as below average for your age."** Uses an acronym and a comparison claim on screen. It quotes the cited source, so it is probably within the hard rule, but "CDC" is jargon for this audience. Fix: say "The U.S. health agency lists under 11 as below average", or keep "CDC" only in the README.
10. **s9-chair-2-about: age and sex buttons do not look changeable.** "Age: 65 to 69" reads as fixed text. Fix: add a hint such as "Press OK to change" or show left/right arrows on the focused button.
11. **Orphan wraps** ("down." in s4-3, "ready." in s4-9, "left" in s5-intro-2, "week." in s6). Cosmetic. Fix: widen the text column or insert a manual line break after the first sentence.
