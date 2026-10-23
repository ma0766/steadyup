package com.steadyup.tv

import org.json.JSONObject

// Messages the relay sends us. Parsing is pure so JVM unit tests cover it (no Android needed).
sealed class ServerMsg {
    data class Code(val code: String, val expiresInSec: Int) : ServerMsg()
    object Paired : ServerMsg()
    object PeerLeft : ServerMsg()
    data class Error(val message: String) : ServerMsg()
    data class Other(val type: String, val raw: JSONObject) : ServerMsg()
    data class Pose(val t: Long, val frame: PoseFrame) : ServerMsg()
    data class Rep(val move: String, val count: Int) : ServerMsg()
    data class CueMsg(val text: String) : ServerMsg()
    data class ViewState(val inView: Boolean) : ServerMsg()
    object Unreadable : ServerMsg()

    companion object {
        fun parse(text: String): ServerMsg = try {
            val o = JSONObject(text)
            when (val t = o.optString("type")) {
                "code" -> Code(o.getString("code"), o.optInt("expiresInSec", 600))
                "paired" -> Paired
                "peer-left" -> PeerLeft
                "pose" -> PoseCodec.fromWire(o.getJSONArray("p"))?.let { Pose(o.optLong("t"), it) } ?: Unreadable
                "rep" -> Rep(o.optString("move"), o.getInt("count"))
                "cue" -> CueMsg(o.getString("text"))
                "state" -> when (o.optString("state")) {
                    "out-of-view" -> ViewState(false)
                    "in-view" -> ViewState(true)
                    else -> Other(t, o)
                }
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
    const val SAFETY_1 = "Check with your doctor before starting new exercise."
    const val SAFETY_2 = "Always use a sturdy chair."
    const val SAFETY_OK = "I understand"
    const val HOME_HELLO = "Good to see you."
    const val HOME_START = "Start today's 10 minutes"
    const val HOLD_CHAIR = "Hold the back of the chair."
    const val INTRO_GO = "I'm ready"
    const val STEP_BACK = "Step back so I can see your whole body."
    const val PAUSED = "Paused. Press OK when you're ready."
    const val REST = "Rest"
    const val REST_SKIP = "Skip rest"
    const val NEXT_UP = "Next:"
    const val WELL_DONE = "Well done. See you tomorrow."
    const val FINISH_TITLE = "Well done!"
    const val FINISH_OK = "Back to start"
    const val OF = "of"
    val ALL = listOf(TRY_AGAIN, CONNECTING, SCAN, OR_TYPE, CONNECTED, PHONE_READY, LOST, SAFETY_1, SAFETY_2, SAFETY_OK,
        HOME_HELLO, HOME_START, HOLD_CHAIR, INTRO_GO, STEP_BACK, PAUSED, REST, REST_SKIP, NEXT_UP, WELL_DONE, FINISH_TITLE, FINISH_OK, OF)
}
