# Latency

S2 latency phone->TV one-way estimate (RTT/2) over 455 frames: median 83 ms, p95 131 ms (target median < 200 ms)

Method: the TV echoes the phone's timestamp; the phone halves the round trip. Deployed stack (CloudFront + API Gateway WebSocket + Lambda), emulator on the same Windows host as the browser.
