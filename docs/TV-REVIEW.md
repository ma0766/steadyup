# TV accessibility review

Scope: 33 TV screenshots (1920x1080, 320 dpi, 40 sp = 80 px) from the latest green run. `s5-session-totals.txt` is not an image and was skipped. Phone, family and "ana" shots were skipped as asked.

Method: each image was looked at by eye. `docs/text-sizes.json` settled close calls. Contrast was judged from the palette: near-black navy background, white / pale blue / yellow / green text, dark navy text on light-blue and mid-blue buttons. All of these are well over 4.5:1 by eye (about 6:1 up to about 15:1).

Legend: PASS = fine. WARN = works, but worth a fix. FAIL = real problem. "n/a" = no buttons on that screen. "Fully pass" means PASS on every column, and no WARN.

| File | Screen | Text size | Contrast | Clipping | Focus ring | Tech words / addresses | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| s0-tv.png | Splash | PASS (title about 130 px, tagline about 90 px) | PASS | PASS | n/a | PASS | Not in text-sizes.json; judged from image. |
| s1-tv-code.png | Pairing | PASS (about 90 px lines, number about 170 px) | PASS (QR is black on white) | PASS | n/a | PASS | Shows only a QR and a 6-number code (691 116). No web address. |
| s1-tv-connected.png | Connected | PASS | PASS | PASS | n/a | PASS | Judged from image. |
| s2-tv-figure.png | Live set, mirror | PASS (smallest line 94 px) | PASS | PASS | n/a | PASS | Cue line pale blue on dark card. Progress bar track about 3.5:1 on the background. |
| s4-1-safety.png | First-run safety | PASS (112 px button) | PASS | PASS | PASS (one white ring) | PASS | Doctor line white, chair line yellow. |
| s4-2-home.png | Home | PASS (94 px) | PASS | PASS | PASS (ring on "Start today's 10 minutes") | PASS | Three other buttons are unfocused. "Start today's 10 minutes" wraps to 2 lines but fits. |
| s4-3-intro.png | Move intro | PASS (94 px) | PASS | PASS | PASS | PASS | "Hold the back of the chair." is in yellow. |
| s4-4-live.png | Live set, cue | PASS | PASS | PASS | n/a | PASS | Big yellow cue "Keep knees over toes". |
| s4-5-rest.png | Rest | PASS (112 px) | PASS | PASS | PASS (Skip rest) | PASS | |
| s4-6-intro-heel.png | Move intro | PASS | PASS | PASS | PASS | PASS | |
| s4-7-live-heel.png | Live set | PASS | PASS | PASS | n/a | PASS | |
| s4-8-finish.png | Finish | PASS (94 px) | PASS | PASS | PASS (Back to start) | PASS | Totals wrap into 2 columns, 2 rows. Readable. |
| s4-9-paused.png | Paused | PASS (112 px) | PASS | PASS | PASS (OK) | PASS | "Paused. Press OK when you're ready." (6 words) wraps to 2 lines. |
| s5-finish.png | Finish, ten sets | PASS (94 px) | PASS | WARN | PASS | PASS | Two columns with long names wrap unevenly: "Leg out to the side, right: 8" and "Foot in front (seconds): 40" split over 2 to 3 lines. Nothing is cut off, but it is hard to scan. |
| s5-intro-2.png | Move intro, leg left | PASS | PASS | PASS | PASS | PASS | Title wraps to 2 lines. Button bottom at 960 px, inside the safe area. |
| s5-intro-4.png | Move intro, march | PASS | PASS | PASS | PASS | PASS | |
| s5-intro-5.png | Move intro, foot in front | PASS | PASS | PASS | PASS | PASS | |
| s5-live-hold.png | Live hold timer | PASS | PASS | PASS | n/a | PASS | "of 20 seconds". |
| s6-tv-week.png | This week | PASS (94 px) | PASS | PASS | PASS (Back to start) | PASS | Family QR with "Family can scan this." No address shown. |
| s8-tv-room.png | Move together lobby | PASS (94 px) | PASS | PASS | PASS (Start together) | PASS | QR plus a 6-number code. "Ana is here." in green. |
| s8-tv-two-cameras.png | Together live | PASS | PASS | PASS | n/a | PASS | "You" and "Ana" labels sit about 19 px above the cue card. Tight but not touching. |
| s8-tv-two-figures.png | Together live | PASS | PASS | PASS | n/a | PASS | Same label gap. Figures are small (feet at about 650 px), but they are only a picture. |
| s9-calibrate.png | Calibrate | PASS (Skip 96 px) | PASS | PASS | PASS (Skip) | PASS | Skip is the smallest button but is clearly labelled and ringed. |
| s9-chair-1-question.png | Chair check question | PASS (103 px) | PASS | PASS | PASS (Yes) | PASS | Yes and No both have labels. The question is 11 words. |
| s9-chair-2-about.png | Chair check, about you | PASS (94 px, narrowest margin) | PASS | PASS | PASS (Sex: Woman) | PASS | "Press OK to change a choice." is about 40.3 sp. It passes with no margin. |
| s9-chair-3-how.png | Chair check, how | PASS (103 px) | PASS | PASS | PASS (I'm ready) | PASS | Six short lines, each 9 words or fewer. Dense but fits. |
| s9-chair-4-go.png | Chair check, timed | PASS (103 px) | PASS | PASS | n/a | PASS | Timer in yellow, count in green. |
| s9-chair-5-result.png | Chair check, result | PASS (94 px) | PASS | PASS | PASS (Back to start) | WARN | "CDC lists under 11 as below average for your age." is a health benchmark. CDC is not one of the sources approved in the spec. See problem 1. Five lines of text with tight spacing. |
| s9-chair-no.png | Chair check declined | PASS (112 px) | PASS | PASS | PASS | PASS | Friendly sentence. |
| s9-finish.png | Finish | PASS (94 px) | PASS | PASS | PASS | PASS | |
| s9-home-grid.png | Home, four buttons | PASS (94 px) | PASS | PASS | PASS (ring on first button) | PASS | Same as s4-2. |
| s9-live-midset.png | Live set, mid-set | PASS | PASS | PASS | n/a | PASS | |

## Counts

- Rows reviewed: 33.
- Fully pass: 31.
- WARN: 2 (`s5-finish.png`, `s9-chair-5-result.png`).
- FAIL: 0.

## Real problems, most serious first

1. **s9-chair-5-result: health claim not covered by the spec.** "CDC lists under 11 as below average for your age." compares a person to a benchmark. The project hard rule says no medical claims beyond quoting the cited studies. The CDC chair-stand score is not one of the five sources the spec allows. Fix: either add the CDC chair-stand source to the spec and README, or drop the line and keep "Share this number with your doctor." It is not a tech word or a layout problem, but it is the one item here that could cause real harm to the submission. The screen is also the densest one: five text lines with little space between them.
2. **s5-finish: uneven wrapping of long move names.** In two columns, "Leg out to the side, right: 8" and "Foot in front (seconds): 40" wrap to 2 to 3 lines and the rows no longer line up. Nothing is clipped. Fix: use one column of 6 short lines, or shorten the names ("Side leg, right: 8", "Foot in front: 40 s").
3. **Narrow text-size margin (minor).** Several screens have a smallest line at 94 px (about 40.3 sp): chair-about, chair-result, home, intro, live, finish, week and together. These pass but have no spare room. Any font change or a longer string could fall below 40 sp. Consider setting the floor at 44 sp (about 100 px) for body text.
4. **Together screen label spacing (minor).** The "You" and "Ana" labels end about 19 px above the cue card in s8-tv-two-figures and s8-tv-two-cameras. This is tight against the card but readable. Add about 12 px of space under the labels.
5. **Heavy instruction screen (minor).** s9-chair-3-how holds six lines at once. Fine for the stated criteria, but for a 72-year-old user it would be easier to split into two screens.

Not found: no raw web addresses on any screen (s1-tv-code shows only the QR and the 6-number code), no tech words, no label-less or clipped buttons, no screen with two focus rings or none where buttons exist. Limits: this review is by eye plus the measured file. I did not run code or measure exact contrast ratios.
