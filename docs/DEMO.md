# Demo script (2:45) with exact clicks

Record the Android TV emulator window plus a phone (or laptop) screen. Two takes at most. Total 2:45.

## Before you press record
1. Start the emulator (Television 1080p, API 30) and leave it running.
2. In WSL: `cd ~/steadyup && source scripts/env.sh && npm run apk` (installs and launches the app).
3. Reset to a first run so the safety screen shows: `"$ADB" shell pm clear com.steadyup.tv`, then `"$ADB" shell am start -n com.steadyup.tv/.MainActivity`.
4. On a phone: scan the QR on the TV (or open https://dh3aa2spgh07i.cloudfront.net and type the number). Prop the phone against a shelf or a book, facing a sturdy chair, 2 m away, with your whole body in view. A chair **without arms**, against a wall, for the chair stand check.
5. History for the family page (disclose it in the video description: "sample history for the demo"): open the app once, then `node scripts/seed-demo-history.mjs`. It prints the family link. Without it the page shows today only.
6. Remote keys on the emulator: arrow keys = arrows, Enter = OK, Esc = Back. The Home screen is a 2 x 2 grid: **Start** (top left), **Move together** (top right), **This week** (bottom left), **Chair stand check** (bottom right).

## Shots

**0:00 - The problem (15 s, slide or README table, voice-over).** "1 in 4 adults over 65 fall every year. Studies link balance exercise to about a quarter fewer falls. But a coach costs thousands. SteadyUp is that coach on the Fire TV you already own." Put the CDC and Cochrane lines on screen.

**0:15 - Mom pairs (20 s).**
1. TV shows the QR and the 6-number code. Hold the phone up so the camera reads the QR (or open https://dh3aa2spgh07i.cloudfront.net and type the number).
2. Phone says "Connected". TV says "Connected" for a moment, then the safety screen. Press **OK** on "I understand". Lean the phone on the shelf.

**0:35 - It learns how she moves (20 s).**
1. Home: press **OK** on "Start today's 10 minutes".
2. TV: "Let's learn how you move. Stand up slowly, then sit down. Do it two times." Do two slow stands with a hand on the chair. The stick figure copies you; the counter goes 1 of 2, 2 of 2. Say: "It sets its own levels for this person, any height, any distance."

**0:55 - Sit to stand with a form cue (25 s).**
1. Intro: "Sit to stand. Hold the back of the chair." Press **OK** on "I'm ready".
2. Do reps; the big number counts and the fill bar grows. Around rep 4 let your knees drift in once: the banner turns to "Keep knees over toes".
3. Press **Esc** (Back) to stop early: the real reps done are saved.

**1:20 - The chair stand check: the impact moment (30 s).**
1. TV Home: arrow **down**, arrow **right** to "Chair stand check", **OK**.
2. "Can you stand up from a chair without using your hands?" Press **OK** on "Yes".
3. Age and sex are optional: press **OK** on Age twice (65 to 69), arrow down, **OK** on Sex once (Woman), arrow down, **OK** on "Next".
4. Read the instructions aloud in one breath, **OK** on "I'm ready". 3-2-1, then do as many stands as you can for 30 seconds, arms crossed on the chest.
5. The result: your score big, and "CDC lists under 11 as below average for your age. Share this number with your doctor." Say: "A number your doctor can use, from the CDC's own test. No diagnosis, no guesses."

**1:50 - Family sees it (25 s).**
1. TV Home: arrow **down** (This week), **OK**. The TV shows the week and a QR for the family link.
2. On Ana's phone open the family link: "4 sessions this week, up from 2", the streak, "Last time", the plan card ("You did 8 every day. Let's try 10."), and the **chair stand trend**.

**2:15 - Move together (15 s).**
1. TV Home: arrow **right** (Move together), **OK**. The TV shows a number and a QR.
2. Ana scans it with her phone, types her name, joins. TV: "Ana is here." **OK** on "Start together", through the intro. Both stick figures, "You" and "Ana", separate counts, "Together: N".

**2:30 - Close (15 s).** "Video never leaves your phone. Only body points and counts are sent. Built for Fire OS: remote-only, big text, no Google Play services. SteadyUp: balance and strength, at home, with family."

## If something goes wrong on camera
- No camera picture on the phone page: reload, allow the camera, stand 2 m back so the whole body shows.
- "Let's try once more" during the two slow stands: do them slower, hold at the top and bottom for a second. After three tries it carries on with the standard levels.
- TV stuck on a number: wait 4 seconds, it fetches a new one by itself.
- Spoken cues are silent on the emulator: it has no voice engine. Cues show larger on screen. A real Fire TV speaks them.
- Too many wrong numbers: wait one minute.
