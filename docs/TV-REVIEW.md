# TV text size: measured, and what the eye-judging reviews said

**Ground truth (measured on the running app, final green verify on `main`).** The e2e tests dump the TV's UI tree on every screen they visit and fail if any text line is under 92 px tall (at 320 dpi a 40 sp line is 93 px; a 48 sp line measures 112 px). Smallest text line seen per screen, from `docs/text-sizes.json`:

| Screen | Smallest line | At least | Text |
| --- | --- | --- | --- |
| calibrate | 96 px | 41.1 sp | Skip |
| chair-about | 94 px | 40.3 sp | Press OK to change a choice. |
| chair-ask | 103 px | 44.1 sp | Chair stand check |
| chair-go | 103 px | 44.1 sp | Chair stand check |
| chair-how | 103 px | 44.1 sp | Sit in the middle of a chair without arm |
| chair-no | 112 px | 48 sp | Back to start |
| chair-ready | 103 px | 44.1 sp | Cross your arms on your chest. |
| chair-result | 94 px | 40.3 sp | Share this number with your doctor. |
| finish | 94 px | 40.3 sp | Sit to stand: 3 |
| home | 94 px | 40.3 sp | Good to see you. |
| intro | 94 px | 40.3 sp | Lift one knee, then the other. |
| live | 94 px | 40.3 sp | Stand up slowly. Then sit back down. |
| paused | 112 px | 48 sp | OK |
| rest | 112 px | 48 sp | Next: Heel raises |
| safety | 112 px | 48 sp | I understand |
| together | 94 px | 40.3 sp | Family can join with this. |
| week | 94 px | 40.3 sp | 1 day in a row. |

Smallest anywhere: **94 px, which is 40.3 sp or more**, so every screen the tests visit meets the 40 sp rule. The pairing screen (s1-tv-code) is not stepped through by `waitScreen`; its text sizes are 44 to 80 sp in the code (checked by `tests/unit/s9-words.test.ts`).

**The reviewers who judged by eye** (three fresh reviewers over the screenshots, each told its sizes were estimates good to about 4 px) disagreed with each other: 29 PASS / 3 BORDERLINE, then 14 PASS / 18 BORDERLINE, never a FAIL, and none could prove any line under 80 px. Contrast was 6.5:1 or better everywhere, no clipped or overlapping text, a visible focus ring on every screen with buttons. The measurement above settles the size question. Real problems they found were fixed (clipped Together total, squashed chair result button, wrong rest and finish screenshots, focus ring, grid widths, chair instructions at 44 sp, and a button label that the stricter 92 px measurement showed clipped). Design notes still open: the long pairing address is the typed fallback; the Home screen shows four equal choices; totals on the finish screen flow into two columns.

The table below is the last eye-review (an estimate, kept for the record).


Reviewer pass over 32 TV screenshots (1920x1080, density 2.0). Skipped: names with phone, family, ana; the .txt file.

Method: I judged by eye. Font size is estimated from capital height (Roboto cap height is about 0.71 of the font size, so 80 px font is about 57 px cap). Each estimate is good to about plus or minus 4 px. Pass needs an estimate of 86 px or more. BORDERLINE means the smallest line is within about 4 px of the 80 px floor (40 sp). I could not prove any line is under 80 px, so there are no FAIL rows. Several secondary lines may be exactly 40 sp, which is the limit.

Contrast: every text color I saw is light on a near-black navy, or dark text on light-blue or mid-blue buttons. Estimated ratios are 7:1 or better everywhere. Nothing is near 4.5:1. The grey unfilled part of the progress bar is a graphic, not text.

| File | Screen | Text size | Contrast | Clipping | Focus ring | Note |
| --- | --- | --- | --- | --- | --- | --- |
| s0-tv.png | Splash | BORDERLINE: tagline "Your balance coach" about 80 px | OK | none | no buttons | Title is large. Tagline is at the floor. |
| s1-tv-code.png | Pairing code | PASS: "Or type this number:" about 87 px, address about 90 px, code about 150 px | OK | none, but the address wraps and leaves ".net" alone on a line | no buttons | The address is a long machine string with no label saying where to type it. See problems. |
| s1-tv-connected.png | Connected | PASS: smallest "Your phone is ready." about 98 px | OK | none | no buttons | Clear. |
| s2-tv-figure.png | Live set | BORDERLINE: cue "Stand up slowly. Then sit back down." about 84 px | OK | none | no buttons | Header "Move 1 of 10" about 87 px. Count is huge. Left margin is 96 px, right at the overscan edge. |
| s4-1-safety.png | First-run safety | PASS: smallest text about 115 px, button about 98 px | OK | none | visible (white ring about 16 px, light fill) | Best screen in the set. |
| s4-2-home.png | Home | BORDERLINE: "Good to see you." about 84 px; buttons about 82 px bold | OK (dark on mid-blue) | none; "Start today's 10 minutes" wraps to 2 lines but fits | visible on Start; other 3 are mid-blue, clearly different | Focused vs unfocused is easy to tell. Four buttons is more than one main action. |
| s4-3-intro.png | Move intro | BORDERLINE: description about 84 px | OK | none | visible (I'm ready) | "Hold the back of the chair." wraps with "chair." alone on line 2. |
| s4-4-live.png | Live set | PASS: smallest "Move 1 of 3" about 87 px | OK | none | no buttons | Yellow cue is about 105 px bold. Good. |
| s4-5-rest.png | Rest | PASS: smallest "Next: Heel raises" about 98 px | OK | none | visible (Skip rest) | Clear. |
| s4-6-intro-heel.png | Move intro | BORDERLINE: description about 84 px | OK | none | visible | Same layout as s4-3. |
| s4-7-live-heel.png | Live set | BORDERLINE: cue "Rise up on your toes. Then lower slowly." about 84 px | OK | none | no buttons | Header about 87 px. |
| s4-8-finish.png | Finish | PASS: smallest "Sit to stand: 3" about 87 px | OK | none | visible (Back to start) | Totals flow in two columns, so "March in place" shows before "Heel raises". Reading order is odd. |
| s4-9-paused.png | Paused | PASS: smallest text about 94 px (OK button) | OK | none; "ready." sits alone on line 2 | visible (OK) | Clear. |
| s5-finish.png | Finish, full plan | BORDERLINE: totals lines about 84 px | OK | none, but dense: 5 wrapped lines, button 82 px from the bottom edge | visible | Two uneven columns. "Foot in front (seconds): 40" and "Leg out to the side, right: 8" wrap. Hard to scan. |
| s5-intro-2.png | Move intro | BORDERLINE: "Lift one leg out to the side." about 80 px | OK | none | visible | Title wraps and leaves "left" alone. |
| s5-intro-4.png | Move intro | BORDERLINE: "Lift one knee, then the other." about 80 px | OK | none | visible | Fine otherwise. |
| s5-intro-5.png | Move intro | BORDERLINE: "Put one foot right in front of the other." about 84 px | OK | none | visible | Fine otherwise. |
| s5-live-hold.png | Live hold | BORDERLINE: cue about 84 px | OK | none | no buttons | "of 20 seconds" is large. Figure is clear. |
| s6-tv-week.png | This week | BORDERLINE: "Heel raises: 3" about 80 px, "1 day in a row." about 84 px | OK | none, but the left column is packed: button bottom is 72 px from the screen edge | visible (Back to start) | Many size and color steps in one column. QR caption about 91 px. |
| s8-tv-room.png | Move together lobby | BORDERLINE: "Family can join with this." about 84 px | OK | none | visible (Start together) | Room number about 150 px. Fine. |
| s8-tv-two-cameras.png | Together live | BORDERLINE: cue about 84 px | OK | none; "You" and "Ana" labels sit 17 px above the cue panel | no buttons | "1 of 3" and "Together: 3" side by side can confuse. |
| s8-tv-two-figures.png | Together live | PASS: smallest "Move 1 of 1" about 87 px | OK | none; labels tight above the cue panel | no buttons | Yellow cue is about 105 px. Good. |
| s9-calibrate.png | Chair check retry | PASS: description about 88 px | OK | none | visible (Skip) | Five text blocks, but they fit. |
| s9-chair-1-question.png | Chair check question | PASS: smallest "Chair stand check" about 87 px | OK | none | visible on Yes; No clearly different | Clear. Question is big and bold. |
| s9-chair-2-about.png | Age and sex | BORDERLINE: "Press OK to change a choice." about 84 px | OK | none | visible on Sex; Age and Next are mid-blue | Buttons about 88 px. |
| s9-chair-3-how.png | Chair check steps | PASS: step lines about 88 px | OK | none, but title and first line nearly touch and the button is 88 px from the bottom | visible | Six centered lines. Packed, but all text fits. |
| s9-chair-4-go.png | Chair check live | BORDERLINE: cue about 84 px | OK | none | no buttons | Title about 91 px, timer about 105 px. |
| s9-chair-5-result.png | Chair check result | BORDERLINE: "CDC lists under 11..." about 84 px | OK | none, but dense: button 72 px from the bottom edge | visible | "age." sits alone on a line. "CDC" is an acronym. |
| s9-chair-no.png | Skip check | PASS: text about 120 px | OK | none | visible | Clear. |
| s9-finish.png | Finish | PASS: smallest "Sit to stand: 8" about 88 px | OK | none | visible | Clear. |
| s9-home-grid.png | Home | BORDERLINE: same as s4-2 (about 82 to 84 px) | OK | none | visible on Start | Same screen as s4-2. |
| s9-live-midset.png | Live set | PASS: smallest "Move 1 of 1" about 87 px | OK | none | no buttons | Cue is about 105 px bold. |

## Counts

PASS 14, BORDERLINE 18, FAIL 0 (32 rows).

## Problems, most serious first

1. The pairing address on s1-tv-code is a raw machine string (`dh3aa2spgh07i.cloudfront.net`). It has no label saying what to do with it, it breaks to ".net" alone on a second line, and "cloudfront" is a tech word on screen. A person who cannot scan the QR cannot use it. Size is fine (about 90 px). Suggest a label such as "Or go to this page on your phone", or no address at all.
2. The most common secondary line (cues, move descriptions, home buttons, week list, lobby) is about 80 to 84 px. Meets the 40 sp rule on paper with no margin. A 4 px error flips it. Raise these lines to 44 sp (88 px), as was done for the pairing and week screens.
3. Dense screens: s5-finish (5 wrapped lines, two uneven columns, button 82 px from the bottom), s9-chair-5 (4 text blocks, button 72 px from the bottom) and s6-tv-week (left column packed, button 72 px from the bottom). Real TVs may crop about 5 percent at the edges (about 54 px). Nothing is clipped here, but there is little slack. Suggest fewer lines or a single column.
4. Finish totals read in an odd order on s4-8 and s5-finish. The two-column flow shows "March in place" before "Heel raises" and splits the list. Use one column in plan order.
5. Orphan words from wrapping: "chair." (intros), "left" (s5-intro-2 title), "ready." (s4-9), "age." (s9-chair-5), ".net" (s1). Small, but harder for slow readers.
6. On s8-tv-two-cameras and s8-tv-two-figures, the "You" and "Ana" labels sit 17 px above the cue panel, and "1 of 3" next to "Together: 3" mixes two counts. Add spacing and label the shared number.
7. s9-chair-5 uses "CDC lists under 11 as below average for your age." CDC is an acronym. Also check this line against the rule "no claims beyond quoting cited studies". It is a quote, but it is a health judgement on screen.
8. s4-2 and s9-home-grid show four equal buttons. The spec says one main action per screen. The focus ring is clear, so this is a design note, not a failure.

No contrast failures, no cut-off or overlapping text, no empty or clipped buttons. Every screen with buttons shows one clearly focused button (thick white ring, lighter fill).
