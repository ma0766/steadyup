# Feedback on the Amazon / AWS tools we used

Written from what actually happened while building SteadyUp. Nothing here was tested on a physical Fire TV.

## Fire TV / Fire OS
- **Target used:** Android TV emulator, API 30 (Android 11 = Fire OS 8), 1080p, run on Windows; the app was built from WSL.
- **Worked:** A plain Android app with Jetpack Compose for TV (`androidx.tv:tv-material`) and `minSdk 28` installed and ran with no changes. Leanback launcher intent, D-pad focus, and OK/Back all behaved as on Android TV.
- **Worked:** No Google Play services needed. We used ZXing core for the QR and Android `TextToSpeech`; MediaPipe runs on the phone, not on the TV.
- **Did not work / friction:** The Vega SDK and Fire TV simulator were not an option from WSL. We had no way to test on Fire TV hardware overnight.
- **Did not work:** The Android TV emulator image has no text-to-speech engine (`engine ready=false`), so spoken cues cannot be heard there. The app stays usable: it shows every sentence on screen and logs what it would say.
- **Friction:** `adb.exe` (Windows) cannot always install from a `\\wsl.localhost\` path. We copy the APK to a Windows temp folder first.
- **Suggestion:** A documented "Fire OS 8 = API 30 emulator image" setup and a note that TTS is missing from it would save time.

## Amazon Bedrock
- **Used for:** the weekly plan only, after a session (never in the live loop). Claude Haiku through the Converse API.
- **Worked:** Once access was right, a plan came back in about a second and the JSON validated with zod.
- **Friction:** `anthropic.claude-haiku-5-5` returned "not available for this account". The on-demand model that works is `us.anthropic.claude-haiku-4-5-20251001-v1:0`, which needs the US inference-profile id (and IAM on both the profile and the foundation model ARNs). The error text did not say which id to use instead.
- **Suggestion:** Say in the error which inference profile id would work for the account.

## API Gateway (WebSocket and HTTP), Lambda
- **Used for:** the relay between phone and TV (pairing, body points, counts) and the history/plan API.
- **Worked:** WebSocket API plus one Lambda for connect/disconnect/default is simple. Median one-way phone-to-TV delay measured at about 65 to 90 ms on the deployed stack.
- **Friction:** Creating a new `ApiGatewayManagementApiClient` on every invocation produced `getaddrinfo EBUSY` under load and dropped messages. Reusing one client per endpoint and retrying transient DNS errors fixed it. The phone also re-sends the latest count every second so one dropped message cannot stall a set.
- **Friction:** No server-side broadcast and no per-connection state, so every message is a Lambda invocation plus a DynamoDB read (we cache paired connections in memory).

## DynamoDB, S3, CloudFront, CDK
- **Worked:** On-demand DynamoDB with TTL keeps cost at zero when idle. One table holds pairing codes, connections, rooms, history sets and the plan. CDK v2 deployed the whole stack in one command.
- **Friction:** `BucketDeployment` of the 45 MB MediaPipe wasm files makes every deploy about a minute or more. CloudFront caching is turned off so a deploy needs no invalidation.
- **Needed:** CloudFront for HTTPS, because the phone camera needs a secure page.

## Not tried
Amazon Appstore listing (needs review and a developer account), Alexa, real Fire TV hardware, the Fire TV simulator.
