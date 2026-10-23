# Demo script (2:45) with exact clicks

Record the Android TV emulator window plus a phone (or laptop) screen. Two takes at most.

## Before you press record
1. Start the emulator (Television 1080p, API 30) and leave it running.
2. In WSL: `cd ~/steadyup && source scripts/env.sh && npm run apk` (installs and launches the app).
3. Reset to a first run so the safety screen shows: `"$ADB" shell pm clear com.steadyup.tv`, then `"$ADB" shell am start -n com.steadyup.tv/.MainActivity`.
4. On a phone: open the address shown under the QR later. Prop the phone against a shelf or a book, facing a sturdy chair, 2 m away, with your whole body in view.
5. Put a sturdy chair in frame. Mute notifications.
5b. Needed for the "4 sessions this week, up from 2" line (otherwise the page shows today's session only): open the app once, then `node scripts/seed-demo-history.mjs` (prints the family link).
6. Remote keys on the emulator: arrow keys = arrows, Enter = OK, Esc = Back.

## Shots

**0:00 - The problem (screen text, voice-over).** Show a slide or the README table. Say: "1 in 4 adults over 65 fall every year. Studies link balance exercise to about a quarter fewer falls. But a coach costs thousands." Put the CDC and Cochrane lines on screen.

**0:20 - Mom opens SteadyUp on Fire TV and pairs.**
1. TV shows the QR and the 6-number code. Hold the phone up so the camera shows the QR on the screen (or type the number on the phone page).
2. Phone says "Connected". TV says "Connected" for a moment.
3. TV shows the safety screen. Press **OK** on "I understand".
4. Lean the phone on the shelf.

**0:40 - Stick figure copies her; sit to stand.**
1. Home screen: press **OK** on "Start today's 10 minutes".
2. Move intro: "Sit to stand. Hold the back of the chair." Press **OK** on "I'm ready".
3. Stand and sit with a hand on the chair. The stick figure copies you; the big number counts reps.
4. Around rep 4 let your knees drift inward once. The TV shows and says "Keep knees over toes."

**1:20 - Finish and the family page.**
1. Let the set finish (or skip rests with **OK**) until the finish screen: totals and "See you tomorrow."
2. On Ana's phone open the family link (scan the QR on the TV's "This week" screen: Home, arrow down twice, **OK**).
3. Ana's page shows "4 sessions this week. Up from 2.", the streak, and "Last time". After a week of use the plan card reads, for example, "You did 8 every day. Let's try 10."

**1:50 - Move together.**
1. TV Home: arrow down once to "Move together", press **OK**. The TV shows a number and a QR.
2. Ana scans the QR on the TV with her phone, types her name, and joins (or opens the address from the family page and types the number). TV says "Ana is here."
3. Press **OK** on "Start together", then through the intro. The TV shows both stick figures labelled "You" and "Ana", separate counts, and "Together: 18".

**2:20 - Privacy and close.**
Say: "Video never leaves your phone. Only body points and counts are sent." Show the README "Safety and privacy" section. Close: "Built for Fire OS, runs on the Fire TV you already own."

## If something goes wrong on camera
- No camera picture on the phone page: reload, allow the camera, stand 2 m back so the whole body shows.
- TV stuck on a number: wait 4 seconds, it fetches a new one by itself.
- Spoken cues are silent on the emulator: it has no voice engine. Cues show on screen. A real Fire TV speaks them.
