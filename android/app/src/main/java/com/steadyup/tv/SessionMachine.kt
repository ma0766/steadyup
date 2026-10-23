package com.steadyup.tv

// The whole TV session as a pure state machine: (screen, event) -> (new screen, effects).
// No Android, no clock of its own (time comes in with every event), so JVM tests can walk a full session.
sealed class Screen {
    object Safety : Screen()
    object Home : Screen()
    object Week : Screen()
    data class Intro(val i: Int) : Screen()
    data class Live(val i: Int, val count: Int, val cue: String?) : Screen()
    data class Paused(val i: Int, val count: Int) : Screen()
    data class Rest(val next: Int, val secondsLeft: Int) : Screen()
    data class Finish(val totals: List<Pair<String, Int>>) : Screen()

    fun logName(): String = when (this) {
        Safety -> "safety"; Home -> "home"; Week -> "week"
        is Intro -> "intro:$i"; is Live -> "live:$i"; is Paused -> "paused"
        is Rest -> "rest:$next"; is Finish -> "finish"
    }
}

sealed class Ev {
    object Ok : Ev()
    object OpenWeek : Ev()
    object Back : Ev()
    data class Count(val value: Int) : Ev()
    data class Cue(val text: String) : Ev()
    object OutOfView : Ev()
    object InView : Ev()
    object PhoneLost : Ev()
    object Tick : Ev()
}

sealed class Fx {
    data class Speak(val text: String, val force: Boolean = false) : Fx()
    data class StartSet(val item: PlanItem) : Fx()
    object EndSet : Fx()
    object SafetyDone : Fx()
    object SessionStart : Fx()
    object OpenWeek : Fx()
    data class RecordSet(val item: PlanItem, val cues: Int) : Fx()
}

class SessionMachine(
    private val plan: List<PlanItem>,
    private val restSec: Int = 20,
    private val outOfViewMs: Long = 10_000,
    private val cueShowMs: Long = 4_000,
    firstRun: Boolean = true,
) {
    var screen: Screen = if (firstRun) Screen.Safety else Screen.Home
        private set

    private var base = 0                       // reps already counted before a pause/resume
    private var total = 0                      // base + what the phone has counted since the set started
    private var outSince: Long? = null         // when the person left view (null = in view)
    private var cueUntil = 0L
    private var cuesInSet = 0
    private var restEnd = 0L
    private val done = LinkedHashMap<String, Int>() // title -> reps/seconds done, for the finish screen

    fun item(i: Int) = plan[i]

    fun on(ev: Ev, now: Long): List<Fx> {
        val fx = ArrayList<Fx>()
        val s = screen
        when (ev) {
            Ev.Ok -> when (s) {
                Screen.Safety -> { screen = Screen.Home; fx += Fx.SafetyDone }
                Screen.Home -> { done.clear(); fx += Fx.SessionStart; enterIntro(0, fx) }
                Screen.Week -> screen = Screen.Home
                is Screen.Intro -> { startSet(s.i, 0, fx) }
                is Screen.Paused -> { base = s.count; startSet(s.i, s.count, fx) }
                is Screen.Rest -> enterIntro(s.next, fx)   // skip the rest
                is Screen.Finish -> screen = Screen.Home
                is Screen.Live -> {}
            }
            Ev.OpenWeek -> if (s is Screen.Home) { screen = Screen.Week; fx += Fx.OpenWeek }
            Ev.Back -> if (s !is Screen.Home && s !is Screen.Safety) {
                if (s is Screen.Live || s is Screen.Paused) fx += Fx.EndSet
                screen = Screen.Home
            }
            is Ev.Count -> if (s is Screen.Live) {
                total = base + ev.value
                val it = plan[s.i]
                if (total >= it.target) finishSet(s.i, it, now, fx) else screen = s.copy(count = total)
            }
            is Ev.Cue -> if (s is Screen.Live) {
                screen = s.copy(cue = ev.text); cueUntil = now + cueShowMs; cuesInSet++
                fx += Fx.Speak(ev.text)
            }
            Ev.OutOfView -> if (s is Screen.Live && outSince == null) {
                outSince = now
                fx += Fx.Speak(Sentences.STEP_BACK)
            }
            Ev.InView -> outSince = null
            Ev.PhoneLost -> if (s is Screen.Live) { fx += Fx.EndSet; screen = Screen.Paused(s.i, s.count); outSince = null }
            Ev.Tick -> when (s) {
                is Screen.Live -> {
                    val o = outSince
                    if (o != null && now - o >= outOfViewMs) {
                        fx += Fx.EndSet; screen = Screen.Paused(s.i, s.count); outSince = null
                        fx += Fx.Speak(Sentences.PAUSED, force = true)
                    } else if (s.cue != null && now >= cueUntil) screen = s.copy(cue = null)
                }
                is Screen.Rest -> {
                    val left = ((restEnd - now + 999) / 1000).toInt()
                    if (left <= 0) enterIntro(s.next, fx) else if (left != s.secondsLeft) screen = s.copy(secondsLeft = left)
                }
                else -> {}
            }
        }
        return fx
    }

    private fun enterIntro(i: Int, fx: MutableList<Fx>) {
        screen = Screen.Intro(i)
        fx += Fx.Speak(Sentences.HOLD_CHAIR, force = true)   // before every set
    }

    private fun startSet(i: Int, startCount: Int, fx: MutableList<Fx>) {
        base = startCount; total = startCount; outSince = null; cueUntil = 0
        if (startCount == 0) cuesInSet = 0
        screen = Screen.Live(i, startCount, null)
        fx += Fx.StartSet(plan[i])
    }

    private fun finishSet(i: Int, it: PlanItem, now: Long, fx: MutableList<Fx>) {
        fx += Fx.EndSet
        fx += Fx.RecordSet(it, cuesInSet)
        val label = if (it.isHold) "${it.title} (seconds)" else it.title
        done[label] = (done[label] ?: 0) + it.target
        base = 0; total = 0
        if (i + 1 < plan.size) {
            restEnd = now + restSec * 1000L
            screen = Screen.Rest(i + 1, restSec)
        } else {
            screen = Screen.Finish(done.toList())
            fx += Fx.Speak(Sentences.WELL_DONE, force = true)
        }
    }
}
