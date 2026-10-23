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
    data class Room(val code: String) : ServerMsg()
    data class Guest(val name: String, val joined: Boolean) : ServerMsg()
    /** A message from family joined to this room (tagged by the relay), not from this TV's own phone. */
    data class FromGuest(val name: String, val inner: ServerMsg) : ServerMsg()
    object Unreadable : ServerMsg()

    companion object {
        fun parse(text: String): ServerMsg = try {
            val o = JSONObject(text)
            if (o.optBoolean("guest")) { val name = o.optString("name", "Guest"); o.remove("guest"); FromGuest(name, parse(o.toString())) }
            else when (val t = o.optString("type")) {
                "room" -> Room(o.getString("code"))
                "guest" -> Guest(o.optString("name", "Guest"), o.optString("event") == "joined")
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
    const val HOME_TOGETHER = "Move together"
    const val TOGETHER_TITLE = "Move together"
    const val TOGETHER_SCAN = "Family can join with this."
    const val TOGETHER_WAIT = "Waiting for family…"
    const val TOGETHER_START = "Start together"
    const val YOU = "You"
    const val TOGETHER_TOTAL = "Together:"
    const val HOME_WEEK = "This week"
    const val WEEK_TITLE = "This week"
    const val WEEK_NONE = "No sessions yet. Let's start."
    const val WEEK_AGAIN = "Start again today."
    const val WEEK_LAST = "Last time:"
    const val WEEK_FAMILY = "Family can scan this."
    const val WEEK_LOADING = "Getting your week…"
    const val WEEK_PROBLEM = "We can't reach your week right now."
    val ALL = listOf(TRY_AGAIN, CONNECTING, SCAN, OR_TYPE, CONNECTED, PHONE_READY, LOST, SAFETY_1, SAFETY_2, SAFETY_OK,
        HOME_HELLO, HOME_START, HOLD_CHAIR, INTRO_GO, STEP_BACK, PAUSED, REST, REST_SKIP, NEXT_UP, WELL_DONE, FINISH_TITLE, FINISH_OK, OF,
        HOME_TOGETHER, TOGETHER_TITLE, TOGETHER_SCAN, TOGETHER_WAIT, TOGETHER_START, YOU, TOGETHER_TOTAL,
        HOME_WEEK, WEEK_TITLE, WEEK_NONE, WEEK_AGAIN, WEEK_LAST, WEEK_FAMILY, WEEK_LOADING, WEEK_PROBLEM)
}
