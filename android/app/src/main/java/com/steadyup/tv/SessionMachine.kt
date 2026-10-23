package com.steadyup.tv

// The whole TV session as a pure state machine: (screen, event) -> (new screen, effects).
// No Android, no clock of its own (time comes in with every event), so JVM tests can walk a full session.
enum class Next { SESSION, CHAIR }

sealed class Screen {
    object Safety : Screen()
    object Home : Screen()
    object Week : Screen()
    object Together : Screen()
    data class Calibrate(val next: Next, val tries: Int, val cycles: Int, val retry: Boolean) : Screen()
    object ChairAsk : Screen()
    object ChairNo : Screen()
    data class ChairAbout(val age: Int, val sex: Int) : Screen()
    data class ChairHow(val age: Int, val sex: Int) : Screen()
    data class ChairReady(val n: Int, val age: Int, val sex: Int) : Screen()
    data class ChairGo(val count: Int, val left: Int, val cue: String?, val age: Int, val sex: Int) : Screen()
    data class ChairResult(val score: Int, val age: Int, val sex: Int) : Screen()
    data class Intro(val i: Int) : Screen()
    data class Live(val i: Int, val count: Int, val cue: String?) : Screen()
    data class Paused(val i: Int, val count: Int) : Screen()
    data class Rest(val next: Int, val secondsLeft: Int) : Screen()
    data class Finish(val totals: List<Pair<String, Int>>) : Screen()

    fun logName(): String = when (this) {
        Safety -> "safety"; Home -> "home"; Week -> "week"; Together -> "together"
        is Calibrate -> "calibrate"; ChairAsk -> "chair-ask"; ChairNo -> "chair-no"; is ChairAbout -> "chair-about"
        is ChairHow -> "chair-how"; is ChairReady -> "chair-ready"; is ChairGo -> "chair-go"; is ChairResult -> "chair-result"
        is Intro -> "intro:$i"; is Live -> "live:$i"; is Paused -> "paused"
        is Rest -> "rest:$next"; is Finish -> "finish"
    }
}

sealed class Ev {
    object Ok : Ev()
    object OpenWeek : Ev()
    object OpenTogether : Ev()
    object OpenChair : Ev()
    object Yes : Ev()
    object No : Ev()
    object CycleAge : Ev()
    object CycleSex : Ev()
    data class CalProgress(val cycles: Int) : Ev()
    data class Calibrated(val done: Boolean) : Ev()
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
    object OpenRoom : Fx()
    object StartCalibration : Fx()
    object StopCalibration : Fx()
    /** A finished set, or one cut short with Back: `done` is what was really done. */
    data class RecordSet(val item: PlanItem, val done: Int, val cues: Int) : Fx()
    data class SaveChair(val score: Int, val age: Int, val sex: Int) : Fx()
}

class SessionMachine(
    plan0: List<PlanItem>,
    private val restSec: Int = 20,
    private val outOfViewMs: Long = 10_000,
    private val cueShowMs: Long = 4_000,
    firstRun: Boolean = true,
    /** Real app: true (learn this person's own levels before the first set). Tests of the plain flow pass false. */
    needsCalibration: Boolean = false,
) {
    private var plan: List<PlanItem> = plan0
    private var calibrated = !needsCalibration

    /** New weekly targets only land between sessions, never under someone's feet mid-set. */
    fun updatePlan(newPlan: List<PlanItem>): Boolean {
        val s = screen
        if (s !is Screen.Home && s !is Screen.Week && s !is Screen.Together && s !is Screen.Safety && s !is Screen.Finish) return false
        plan = newPlan; return true
    }

    var screen: Screen = if (firstRun) Screen.Safety else Screen.Home
        private set

    private var base = 0                       // reps already counted before a pause/resume
    private var total = 0                      // base + what the phone has counted since the set started
    private var outSince: Long? = null         // when the person left view (null = in view)
    private var cueUntil = 0L
    private var cuesInSet = 0
    private var restEnd = 0L
    private var readyEnd = 0L
    private var chairEnd = 0L
    private val done = LinkedHashMap<String, Int>() // title -> reps/seconds done, for the finish screen

    fun item(i: Int) = plan[i]

    companion object {
        const val CHAIR_SECONDS = 30
        const val CHAIR_COUNTDOWN = 3
        const val MAX_CAL_TRIES = 3
        val CHAIR_ITEM = PlanItem("chair_stand_30", "Chair stand check", Sentences.CHAIR_HOW_5, 60)
    }

    fun on(ev: Ev, now: Long): List<Fx> {
        lastNow = now
        val fx = ArrayList<Fx>()
        val s = screen
        when (ev) {
            Ev.Ok -> when (s) {
                Screen.Safety -> { screen = Screen.Home; fx += Fx.SafetyDone }
                Screen.Home -> startSession(fx)
                Screen.Week -> screen = Screen.Home
                Screen.Together -> startSession(fx)
                is Screen.Calibrate -> { calibrated = true; fx += Fx.StopCalibration; goNext(s.next, fx, s) }   // skip: use the defaults
                Screen.ChairNo -> screen = Screen.Home
                is Screen.ChairAbout -> screen = Screen.ChairHow(s.age, s.sex)
                is Screen.ChairHow -> beginChair(s.age, s.sex, now, fx)
                is Screen.ChairResult -> screen = Screen.Home
                is Screen.Intro -> startSet(s.i, 0, fx)
                is Screen.Paused -> { base = s.count; startSet(s.i, s.count, fx) }
                is Screen.Rest -> enterIntro(s.next, fx)   // skip the rest
                is Screen.Finish -> screen = Screen.Home
                else -> {}
            }
            Ev.OpenChair -> if (s is Screen.Home) screen = Screen.ChairAsk
            Ev.Yes -> if (s is Screen.ChairAsk) screen = Screen.ChairAbout(0, 0)
            Ev.No -> if (s is Screen.ChairAsk) screen = Screen.ChairNo
            Ev.CycleAge -> if (s is Screen.ChairAbout) screen = s.copy(age = (s.age + 1) % Cdc.AGE_LABELS.size)
            Ev.CycleSex -> if (s is Screen.ChairAbout) screen = s.copy(sex = (s.sex + 1) % Cdc.SEX_LABELS.size)
            is Ev.CalProgress -> if (s is Screen.Calibrate) screen = s.copy(cycles = ev.cycles)
            is Ev.Calibrated -> if (s is Screen.Calibrate) {
                if (ev.done) { calibrated = true; goNext(s.next, fx, s) }
                else if (s.tries < MAX_CAL_TRIES) {                      // unclear: ask again, a few times
                    screen = Screen.Calibrate(s.next, s.tries + 1, 0, retry = true)
                    fx += Fx.StartCalibration; fx += Fx.Speak(Sentences.CAL_AGAIN, force = true)
                } else { calibrated = true; goNext(s.next, fx, s) }      // then carry on with the defaults: never stuck
            }
            Ev.OpenWeek -> if (s is Screen.Home) { screen = Screen.Week; fx += Fx.OpenWeek }
            Ev.OpenTogether -> if (s is Screen.Home) { screen = Screen.Together; fx += Fx.OpenRoom }
            Ev.Back -> if (s !is Screen.Home && s !is Screen.Safety) {
                if (s is Screen.Live || s is Screen.Paused) {
                    val c = if (s is Screen.Live) s.count else (s as Screen.Paused).count
                    if (c > 0) fx += Fx.RecordSet(plan[if (s is Screen.Live) s.i else (s as Screen.Paused).i], c, cuesInSet)  // cut short: save what was really done
                    fx += Fx.EndSet
                }
                if (s is Screen.ChairGo) fx += Fx.EndSet
                if (s is Screen.Calibrate) fx += Fx.StopCalibration
                screen = Screen.Home
            }
            is Ev.Count -> when (s) {
                is Screen.Live -> {
                    total = base + ev.value
                    val it = plan[s.i]
                    if (total >= it.target) finishSet(s.i, it, now, fx) else screen = s.copy(count = total)
                }
                is Screen.ChairGo -> screen = s.copy(count = ev.value)
                else -> {}
            }
            is Ev.Cue -> when (s) {
                is Screen.Live -> { screen = s.copy(cue = ev.text); cueUntil = now + cueShowMs; cuesInSet++; fx += Fx.Speak(ev.text) }
                is Screen.ChairGo -> { screen = s.copy(cue = ev.text); cueUntil = now + cueShowMs; fx += Fx.Speak(ev.text) }
                else -> {}
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
                is Screen.ChairReady -> {
                    val left = ((readyEnd - now + 999) / 1000).toInt()
                    if (left <= 0) {
                        chairEnd = now + CHAIR_SECONDS * 1000L
                        screen = Screen.ChairGo(0, CHAIR_SECONDS, null, s.age, s.sex)
                        fx += Fx.StartSet(CHAIR_ITEM)
                    } else if (left != s.n) screen = s.copy(n = left)
                }
                is Screen.ChairGo -> {
                    val left = ((chairEnd - now + 999) / 1000).toInt()
                    if (left <= 0) {                                          // time is up: the score is the stands counted
                        fx += Fx.EndSet; fx += Fx.SaveChair(s.count, s.age, s.sex)
                        screen = Screen.ChairResult(s.count, s.age, s.sex)
                    } else screen = s.copy(left = left, cue = if (s.cue != null && now >= cueUntil) null else s.cue)
                }
                else -> {}
            }
        }
        return fx
    }

    private fun startSession(fx: MutableList<Fx>) {
        done.clear(); fx += Fx.SessionStart
        if (!calibrated) { screen = Screen.Calibrate(Next.SESSION, 1, 0, false); fx += Fx.StartCalibration }
        else enterIntro(0, fx)
    }

    private fun beginChair(age: Int, sex: Int, now: Long, fx: MutableList<Fx>) {
        if (!calibrated) { screen = Screen.Calibrate(Next.CHAIR, 1, 0, false); chairAge = age; chairSex = sex; fx += Fx.StartCalibration }
        else readyChair(age, sex, now)
    }
    private var chairAge = 0
    private var chairSex = 0
    private fun readyChair(age: Int, sex: Int, now: Long) {
        readyEnd = now + CHAIR_COUNTDOWN * 1000L
        screen = Screen.ChairReady(CHAIR_COUNTDOWN, age, sex)
    }

    private fun goNext(next: Next, fx: MutableList<Fx>, from: Screen) {
        when (next) {
            Next.SESSION -> enterIntro(0, fx)
            Next.CHAIR -> readyChair(chairAge, chairSex, lastNow)
        }
    }
    private var lastNow = 0L

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
        fx += Fx.RecordSet(it, it.target, cuesInSet)
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
