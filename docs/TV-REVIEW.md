# TV screenshot accessibility review

Reviewed by eye from the 1920x1080 emulator screenshots (320 dpi, so 40 sp = 80 px). Sizes are estimates from glyph heights (capital height about 0.71 of font size) with +/- 4 px error. Contrast was judged from the visible colours (light text on near-black navy, dark text on light-blue buttons); every pairing I saw is far above 4.5:1. Overall = worst of the four checks.

Most body and subtitle text (light blue, and the white stat lines) measures cap height about 57-60 px, which is about 80-84 px font size. That is at the 40 sp floor, not above it. It passes, but there is no margin.

| File | Screen | Text size | Contrast | Clipping | Focus ring | Overall | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| s0-tv.png | Splash | PASS (smallest "Your balance coach", ~80 px, at floor) | PASS | none | no buttons | PASS | Clean. |
| s1-tv-code.png | Pairing: QR, code, address | BORDERLINE (smallest the web address, ~78-80 px; "Or type this number:" ~80 px) | PASS | none | no buttons | BORDERLINE | Address is the smallest text on any screen. It shows "cloudfront.net", a tech word users can see, and is a long string to type with a remote. |
| s1-tv-connected.png | Connected | PASS (smallest "Your phone is ready.", ~85 px) | PASS | none | no buttons | PASS | Clean. |
| s2-tv-figure.png | Live mirror | PASS (smallest "Stand up slowly..." cue, ~85 px; "of 8" ~100 px) | PASS | none | no buttons | PASS | Progress track is low contrast grey, but it is not text. |
| s4-1-safety.png | First-run safety | PASS (smallest "Always use a sturdy chair.", ~90 px) | PASS | none | visible ("I understand") | PASS | Good. |
| s4-2-home.png | Home, 4 buttons | PASS (button labels ~95 px; "Good to see you." ~82 px) | PASS | none; focused tile is enlarged and its halo starts at x=75, inside the 5% TV safe margin | visible (Start) | PASS | Focused tile grows to within ~7 px of its neighbour. Label wraps to 2 lines only on the focused tile. |
| s4-3-intro.png | Move intro, sit to stand | PASS (smallest sentence ~82 px) | PASS | none | visible ("I'm ready") | PASS | Good. |
| s4-4-live.png | Live set | PASS (cue ~85 px; "Move 1 of 3" ~90 px) | PASS | none | no buttons | PASS | Cue is large and yellow. |
| s4-5-rest.png | Rest | PASS (smallest "Next: Heel raises", ~90 px) | PASS | none | visible ("Skip rest") | PASS | Good. |
| s4-6-intro-heel.png | Move intro, heel raises | PASS (~82 px) | PASS | none | visible | PASS | Good. |
| s4-7-live-heel.png | Live set, heel raises | PASS (~85 px) | PASS | none | no buttons | PASS | Good. |
| s4-8-finish.png | Finish, 3 moves | PASS (stat lines ~85 px) | PASS | none, but "Back to start" text sits ~7-12 px from the inner edge of its button | visible | PASS | Third stat wraps to its own row and the order is odd (March before Heel). Tight button padding. |
| s4-9-paused.png | Paused | PASS (~110 px) | PASS | none | visible ("OK") | PASS | Good. |
| s5-finish.png | Finish, full session | PASS (stat lines ~85 px) | PASS | none; content spans y=100 to 1005, very full | visible | PASS | Crowded: two columns, five wrapped lines. "Foot in front (seconds): 40" reads awkwardly. Button text tight. |
| s5-intro-2.png | Move intro, side leg | PASS (~82 px) | PASS | none | visible | PASS | Title wraps to 2 lines; fits. |
| s5-intro-4.png | Move intro, march | PASS (~82 px) | PASS | none | visible | PASS | Good. |
| s5-intro-5.png | Move intro, foot in front | PASS (~82 px) | PASS | none | visible | PASS | Good. |
| s5-live-hold.png | Live hold timer | PASS (~85 px) | PASS | none | no buttons | PASS | Good. |
| s6-tv-week.png | This week + family QR | PASS (smallest "Last time:" / "Family can scan this.", ~82 px) | PASS | none; text and button close together, left text at x=97 (edge of safe margin) | visible ("Back to start") | PASS | QR has a caption. Left column is dense. |
| s8-tv-room.png | Move together lobby | PASS (smallest "Family can join with this.", ~80 px) | PASS | none | visible ("Start together") | PASS | Good. |
| s8-tv-two-cameras.png | Live set, two people | BORDERLINE ("Together: 2" cannot be judged, half hidden; the rest ~85 px or larger) | PASS | FAIL: "Together: N" is cut in half by the cue box (bottom of the letters hidden) | no buttons | FAIL | The shared total is the key number on this screen and it is unreadable. "You"/"Ana" labels also sit within ~15 px of the cue box. |
| s8-tv-two-figures.png | Live set, two people | BORDERLINE (same: "Together: 0" cut off) | PASS | FAIL: same cut-off | no buttons | FAIL | Same defect. |
| s9-calibrate.png | "Let's try once more." calibration | PASS (smallest "Skip" ~78-80 px bold, borderline; body ~85 px) | PASS | none | visible ("Skip") | PASS | "Skip" button is much smaller than the others; label is the smallest bold text here. |
| s9-chair-1-question.png | Chair check question | PASS (smallest "Chair stand check", ~90 px) | PASS | none | visible (Yes focused, No plain) | PASS | Good. |
| s9-chair-2-about.png | Age / sex choices | PASS (smallest "Press OK to change a choice.", ~80-82 px) | PASS | none; "Sex: Woman" text almost touches its focus ring | visible (Sex) | PASS | Intro sentence wraps with a one-word orphan ("score."). |
| s9-chair-3-how.png | Chair check instructions | PASS (six lines at ~82 px, all at the floor) | PASS | none | visible ("I'm ready") | PASS | Six lines is a lot of text, each is under 12 words. |
| s9-chair-4-go.png | Chair check running | PASS (smallest "stands", ~95 px; "20 s" ~110 px) | PASS | none | no buttons | PASS | "20 s" uses an abbreviation. |
| s9-chair-5-result.png | Chair check score | PASS (smallest "CDC lists under 11...", ~80-82 px) | PASS | FAIL: the button at the bottom is empty and squashed to a thin outline (~40 px tall, no label) | focus ring visible, but on a button with no text | FAIL | Missing or collapsed button label. A user cannot tell what OK does. "CDC" is jargon. Text block fills the screen to y=940. |
| s9-chair-no.png | Chair check skipped | PASS (~110 px) | PASS | none | visible ("Back to start") | PASS | Friendly sentence. |
| s9-finish.png | Finish, one move | PASS (~85 px) | PASS | none; button text tight | visible | PASS | Good. |
| s9-home-grid.png | Home, 4 buttons | PASS (same as s4-2) | PASS | none; same enlarged focused tile | visible | PASS | Identical to s4-2-home. |
| s9-live-midset.png | Live set, cue showing | PASS (~85 px; cue ~110 px) | PASS | none | no buttons | PASS | Good. |

Counts: PASS 28, BORDERLINE 1, FAIL 3 (32 rows).

## Real problems, most serious first

1. **"Together: N" is cut off on the Move together live screen** (s8-tv-two-cameras, s8-tv-two-figures). The cue box overlaps the bottom half of the shared total. This is the headline number of the feature. Move the label up or shrink the figures and bar.
2. **The Chair stand score screen has an empty, collapsed button** (s9-chair-5-result). The bottom button shows a focus ring but no label and almost no height. The screen has no readable way to continue. The text block above it also runs to y=940, so the button was probably squeezed out of room.
3. **The pairing address is the smallest text in the app and shows a tech word** (s1-tv-code). Estimated 78-80 px, below or at the 80 px floor, and it reads "d3ltiulf1p49il.cloudfront.net". That breaks both "40 sp minimum" and "no tech words a user can see". It is also not a realistic thing to type with a remote.
4. **Almost all body text is exactly at the floor** (about 80-84 px, cap height 57-60). Passing on this review, but any 5% drop (different density, font fallback) would break the rule. Consider 44 sp for subtitles and cues.
5. **Finish screens are cramped** (s4-8-finish, s5-finish, s9-finish). Button label sits 7-12 px from the focus ring's inner edge. The full-session Finish uses two wrapped columns up to y=1005. Stat order on s4-8 is odd (March before Heel raises).
6. **Focused Home tile is enlarged and its halo reaches x=75** (s4-2-home, s9-home-grid), inside the 5% TV safe margin, and almost touches its neighbour. Not clipped here, but on overscan TVs the left edge could trim.
7. **Minor wording:** "CDC lists under 11 as below average for your age" (jargon), "20 s" (abbreviation), "Foot in front (seconds): 40" (awkward), orphan words ("score.", "age.").
8. **Small "Skip" button on s9-calibrate** is much smaller than other buttons and its bold text (~78-80 px) is at the floor. It is visible and focused, but is the weakest target on any screen.

Not checked: real Fire TV hardware rendering, TTS, other screens not in the list (family and phone pages were skipped as instructed). The "Together" label size could not be measured because it is half hidden.
