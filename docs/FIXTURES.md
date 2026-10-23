# Fixtures

## Fake camera video (S2)

- File: "Squat - exercise demonstration video.webm", Wikimedia Commons
- URL: https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm
- License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0), author credited on the Commons page (Fitness School channel)
- Converted by `node scripts/make-fixtures.mjs` to `fixtures/squat.y4m` (640x480, 30 fps, about 7 s, loops). Not committed.
- Used only to prove the live mirror (a real person moving, detected by MediaPipe). It is a back-view barbell squat, not a front-view chair stand.

## Synthetic landmark streams (S3 onward)

No freely licensed front-view sit-to-stand video was found, so the rep engine tests use deterministic synthetic landmark streams
(`web/src/engine/fixtures.ts`). They are generated from simple joint trajectories and are labelled as synthetic in every test.
