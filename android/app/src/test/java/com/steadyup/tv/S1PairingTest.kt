package com.steadyup.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class S1PairingTest {
    @Test fun parsesCode() {
        val m = ServerMsg.parse("""{"type":"code","code":"123456","expiresInSec":600}""")
        assertEquals(ServerMsg.Code("123456", 600), m)
    }

    @Test fun parsesPairedAndError() {
        assertEquals(ServerMsg.Paired, ServerMsg.parse("""{"type":"paired"}"""))
        assertEquals(ServerMsg.Error("nope"), ServerMsg.parse("""{"type":"error","message":"nope"}"""))
    }

    @Test fun garbageIsUnreadableNotACrash() = assertEquals(ServerMsg.Unreadable, ServerMsg.parse("not json"))

    @Test fun codeThenPairedWalksToConnected() {
        var s: PairingState = PairingState.Connecting
        s = PairingReducer.reduce(s, ServerMsg.Code("123456", 600))
        assertEquals(PairingState.ShowCode("123456", 600), s)
        s = PairingReducer.reduce(s, ServerMsg.Paired)
        assertEquals(PairingState.Connected, s)
    }

    @Test fun lostSocketKeepsConnectedScreenButShowsSentenceBeforePairing() {
        assertEquals(PairingState.Connected, PairingReducer.connectionLost(PairingState.Connected))
        assertTrue(PairingReducer.connectionLost(PairingState.Connecting) is PairingState.Problem)
    }

    @Test fun joinLinkCarriesTheCode() =
        assertEquals("https://x.example/?code=123456", PairingReducer.joinLink("https://x.example/", "123456"))

    @Test fun codeIsSpacedForReading() = assertEquals("123 456", PairingReducer.spaced("123456"))

    @Test fun everySentenceIsShortAndPlain() {
        val banned = listOf("pose", "landmark", "websocket", "sync", "api", "error code", "server")
        for (s in Sentences.ALL) {
            for (sentence in s.split(Regex("[.?!]\\s*")).filter { it.isNotBlank() })
                assertTrue("too long: $sentence", sentence.trim().split(" ").size < 12)
            banned.forEach { assertTrue("tech word '$it' in: $s", !s.lowercase().contains(it)) }
        }
    }
}
