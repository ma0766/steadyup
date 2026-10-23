package com.steadyup.tv

import org.json.JSONObject

// Messages the relay sends us. Parsing is pure so JVM unit tests cover it (no Android needed).
sealed class ServerMsg {
    data class Code(val code: String, val expiresInSec: Int) : ServerMsg()
    object Paired : ServerMsg()
    object PeerLeft : ServerMsg()
    data class Error(val message: String) : ServerMsg()
    data class Other(val type: String, val raw: JSONObject) : ServerMsg()
    object Unreadable : ServerMsg()

    companion object {
        fun parse(text: String): ServerMsg = try {
            val o = JSONObject(text)
            when (val t = o.optString("type")) {
                "code" -> Code(o.getString("code"), o.optInt("expiresInSec", 600))
                "paired" -> Paired
                "peer-left" -> PeerLeft
                "error" -> Error(o.optString("message", Sentences.TRY_AGAIN))
                else -> Other(t, o)
            }
        } catch (e: Exception) {
            Unreadable
        }
    }
}

// Every sentence the TV shows lives here so one test can check length and word rules.
object Sentences {
    const val TRY_AGAIN = "Something went wrong. Let's try again."
    const val CONNECTING = "Getting ready…"
    const val SCAN = "Scan this with your phone."
    const val OR_TYPE = "Or type this number:"
    const val CONNECTED = "Connected"
    const val PHONE_READY = "Your phone is ready."
    const val LOST = "We lost your phone. Let's reconnect."
    val ALL = listOf(TRY_AGAIN, CONNECTING, SCAN, OR_TYPE, CONNECTED, PHONE_READY, LOST)
}
