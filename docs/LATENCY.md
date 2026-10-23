# Latency

S2 latency phone->TV one-way estimate (RTT/2) over 408 frames: median 66 ms, p95 124 ms (target median < 200 ms)

Method: the TV echoes the phone's timestamp; the phone halves the round trip. Deployed stack (CloudFront + API Gateway WebSocket + Lambda), emulator on the same Windows host as the browser.
