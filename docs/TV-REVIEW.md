# TV accessibility review

> **Update:** the one FAIL below (s1-tv-code, the raw web address) was fixed afterwards: the pairing screen now shows only the QR and the number. See docs/PROGRESS.md.

Text sizes in this review come from the measured data in `docs/text-sizes.json` (smallest text line per screen, read from the running app's UI tree; 40 sp = 93 px, floor is 92 px). Every measured screen is at least 94 px, so text size is PASS wherever the screen is in that file. I did not estimate sizes by eye. The splash, pairing and connected screens are not in the json, so they are marked "not measured". The other columns (contrast, clipping/overlap, focus ring, plain language, 5% safe margin) were judged by looking at each 1920x1080 screenshot. Text-size mapping: s4-3, s4-6, s5-intro-* use `intro`; s4-4, s4-7, s5-live-hold, s9-live-midset, s8 live shots and s2-tv-figure use `live` (same layout); s4-8, s5-finish, s9-finish use `finish`.

Overall status per row: PASS means all six checks pass. "Visual PASS" means all visual checks pass but text size is not measured.

| File | Screen | Text size | Contrast | Clipping / overlap | Focus ring | Note |
| --- | --- | --- | --- | --- | --- | --- |
| s0-tv.png | Splash | not measured, code uses >= 44 sp | PASS | PASS | no buttons | Visual PASS. Large title, centered. |
| s1-tv-code.png | Pairing: QR + number | not measured, code uses >= 44 sp | PASS | FAIL (web address wraps, ".net" alone on a line) | no buttons | FAIL. Shows a raw web address (`dh3aa2spgh07i.cloudfront.net`): a tech word a user can see, and it breaks across two lines. |
| s1-tv-connected.png | Connected | not measured, code uses >= 44 sp | PASS | PASS | no buttons | Visual PASS. |
| s2-tv-figure.png | Live mirror (stick figure) | PASS (live layout, 94 px) | PASS | PASS | no buttons | Header sits ~75 px from top, ok. |
| s4-1-safety.png | First-run safety | PASS (safety, 112 px) | PASS | PASS | visible (I understand) | |
| s4-2-home.png | Home | PASS (home, 94 px) | PASS | PASS | visible (Start today's 10 minutes) | Start label wraps to two lines, not clipped. |
| s4-3-intro.png | Move intro: sit to stand | PASS (intro, 94 px) | PASS | PASS | visible (I'm ready) | |
| s4-4-live.png | Live set | PASS (live, 94 px) | PASS | PASS | no buttons | |
| s4-5-rest.png | Rest | PASS (rest, 112 px) | PASS | PASS | visible (Skip rest) | |
| s4-6-intro-heel.png | Move intro: heel raises | PASS (intro, 94 px) | PASS | PASS | visible (I'm ready) | |
| s4-7-live-heel.png | Live set: heel raises | PASS (live, 94 px) | PASS | PASS | no buttons | |
| s4-8-finish.png | Finish (3 moves) | PASS (finish, 94 px) | PASS | PASS | visible (Back to start) | Totals wrap onto a second row, reads fine. |
| s4-9-paused.png | Paused | PASS (paused, 112 px) | PASS | PASS | visible (OK) | Text is ~102 px from both side edges, just inside the 5% margin. |
| s5-finish.png | Finish (full session) | PASS (finish, 94 px) | PASS | PASS | visible (Back to start) | Two ragged columns; long labels wrap ("Leg out to the side, right: 8"). Left text starts at x=97, right at the margin limit. Readable but busy. |
| s5-intro-2.png | Move intro: leg out to the side | PASS (intro, 94 px) | PASS | PASS | visible (I'm ready) | Title wraps to two lines, fits. |
| s5-intro-4.png | Move intro: march in place | PASS (intro, 94 px) | PASS | PASS | visible (I'm ready) | |
| s5-intro-5.png | Move intro: foot in front | PASS (intro, 94 px) | PASS | PASS | visible (I'm ready) | |
| s5-live-hold.png | Live set: hold timer | PASS (live, 94 px) | PASS | PASS | no buttons | |
| s6-tv-week.png | This week + family QR | PASS (week, 94 px) | PASS | PASS | visible (Back to start) | Left column is tightly packed; button ~30 px under last line. Left text at x=97, right caption ends ~100 px from edge. |
| s8-tv-room.png | Move together: room | PASS (together, 94 px) | PASS | PASS | visible (Start together) | |
| s8-tv-two-cameras.png | Move together: live, two figures | PASS (live layout, 94 px) | PASS | PASS | no buttons | "You" / "Ana" labels end ~17 px above the cue panel: tight, not touching. |
| s8-tv-two-figures.png | Move together: live, two figures | PASS (live layout, 94 px) | PASS | PASS | no buttons | Same tight label spacing. |
| s9-calibrate.png | Calibration retry | PASS (calibrate, 96 px) | PASS | PASS | visible (Skip) | |
| s9-chair-1-question.png | Chair stand: question | PASS (chair-ask, 103 px) | PASS | PASS | visible (Yes) | |
| s9-chair-2-about.png | Chair stand: age and sex | PASS (chair-about, 94 px) | PASS | PASS | visible (Sex: Woman) | Heading wraps ("score." alone on line 2). |
| s9-chair-3-how.png | Chair stand: how to | PASS (chair-how, 103 px) | PASS | PASS | visible (I'm ready) | Six lines of text, dense but readable; bottom margin ~87 px. |
| s9-chair-4-go.png | Chair stand: timed run | PASS (chair-go, 103 px) | PASS | PASS | no buttons | |
| s9-chair-5-result.png | Chair stand: result | PASS (chair-result, 94 px) | PASS | PASS | visible (Back to start) | Four-line message, "age." orphaned on its own line. Contains "CDC" (acronym, not on the SPEC's cited-source list as a chair-stand norm) and "below average": see problems. |
| s9-chair-no.png | Chair stand: declined | PASS (chair-no, 112 px) | PASS | PASS | visible (Back to start) | |
| s9-finish.png | Finish (one move) | PASS (finish, 94 px) | PASS | PASS | visible (Back to start) | |
| s9-home-grid.png | Home (four buttons) | PASS (home, 94 px) | PASS | PASS | visible (Start today's 10 minutes) | |
| s9-live-midset.png | Live set mid-set with cue | PASS (live, 94 px) | PASS | PASS | no buttons | |

## Counts

- 32 screenshots reviewed.
- 29 fully PASS (all six checks).
- 2 visual PASS but text size not measured (s0-tv, s1-tv-connected).
- 1 FAIL (s1-tv-code).

## Real problems, most serious first

1. **s1-tv-code.png: raw web address on the pairing screen.** `dh3aa2spgh07i.cloudfront.net` is a tech string the user can see (breaks the "no tech words" rule), it wraps with ".net" orphaned on its own line, and it is the busiest, least friendly line on the first screen Mom sees. Fix: hide it, or show a short friendly address on one line; keep QR + number.
2. **s9-chair-5-result.png: wording and source.** The line "CDC lists under 11 as below average for your age" tells a possibly anxious user she is "below average", and the CDC chair-stand norm is not among the sources listed in SPEC.md ("cite these, nothing else"). The hard rule bars medical claims beyond quoting cited studies. Verify the cited number and consider softer wording. The text also wraps with "age." alone on a line and uses the acronym "CDC".
3. **s5-finish.png: crowded two-column totals.** Long labels wrap ("Leg out to the side, right: 8", "Foot in front (seconds): 40"), and the two columns read in an odd order. Not a rule failure, but the busiest summary screen. A single column or shorter labels would read better.
4. **s8-tv-two-cameras.png / s8-tv-two-figures.png: "You" and "Ana" labels sit about 17 px above the cue panel.** Close but not overlapping; a small gap increase would make it safer.
5. **s9-chair-3-how.png: six stacked lines.** Passes every check, but is dense for one screen; it could be split across two.
6. **Margins:** several screens put text 97-103 px from the left or right edge (s4-9-paused, s5-finish, s6-tv-week). That is inside the 96 px (5%) limit, with almost no spare room. Overscan on a real TV may crop it; a little more padding would help.
7. **No buttons on live screens (s2, s4-4, s4-7, s5-live-hold, s8, s9-chair-4, s9-live-midset):** by design, but the user has no on-screen way out mid-set. Back on the remote is the only exit; confirm that works and is explained.

No contrast failures, no clipped or squashed buttons, no missing labels, and exactly one visible focus ring on every screen with buttons.
