# Friction log

Part of the Amazon hackathon scoring. The "what happened" column is left for the human to fill in with their own words; the other columns record what we found while building.

| Step | Severity | What happened (human to fill in) | Workaround | Suggestion |
| --- | --- | --- | --- | --- |
| Install the Vega SDK / Fire TV simulator | High | | The Vega SDK is not supported on WSL, so we used the Android TV emulator (API 30, same Android version as Fire OS 8) on Windows. | Document a supported path for WSL or Linux, or ship a Fire OS emulator image. |
| Read the rules vs the FAQ on emulators | Medium | | The Rules ask for the app running on a Fire TV device or simulator; the FAQ says "an emulator (Android TV Emulator or the Fire TV/Vega simulator) is fine." We followed the FAQ and said so in the README. | Make the Rules and FAQ say the same thing. |
| Test spoken cues on the emulator | Medium | | The Android TV emulator image has no text-to-speech engine. We show every sentence on screen and verify the calls through logs and tests. | List what the emulator image lacks (TTS) next to the Fire OS docs. |
| Install the APK from WSL | Low | | `adb.exe` could not reliably read a `\\wsl.localhost\...` path. Copy the APK to a Windows temp folder, then install. | Mention WSL path limits in the adb docs. |
| Call Bedrock Claude Haiku | Medium | | `anthropic.claude-haiku-5-5` was refused for the account; the working model is `us.anthropic.claude-haiku-4-5-20251001-v1:0` via a US inference profile, with IAM for both ARNs. | Say in the error which inference profile id would work. |
| Relay many small messages through a Lambda | Medium | | A new management API client per call caused `getaddrinfo EBUSY` and dropped messages under load. One client per endpoint plus retries fixed it. | Warn about client reuse in the WebSocket docs. |
| Run MediaPipe on a TV | Medium | | Fire OS has no Google Play services, so pose tracking runs on the phone's browser and the TV only draws body points. | A TV-side pose option that works without Play services would remove the phone. |
| Deploy a static site with large wasm files | Low | | 45 MB of wasm makes each CDK deploy slow. Cache is off so no invalidation is needed. | Document asset size limits and a faster deploy path. |
| Publish to the Amazon Appstore | Info | | Needs a developer account and review (days), so it is not part of the overnight build. The app installs by sideloading. | Offer a fast test track for hackathon entries. |
