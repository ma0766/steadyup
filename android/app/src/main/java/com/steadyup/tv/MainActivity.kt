package com.steadyup.tv

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import kotlinx.coroutines.delay
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private var pairing by mutableStateOf<PairingState>(PairingState.Connecting)
    private var splash by mutableStateOf(false)            // "Connected" shown for a moment before the session
    private var screen by mutableStateOf<Screen>(Screen.Home)
    private var pose by mutableStateOf<PoseFrame?>(null)
    private val smoother = PoseSmoother()
    private var poseCount = 0
    private val handler = Handler(Looper.getMainLooper())
    private val clearPose = Runnable { pose = null; smoother.reset() } // no body points for 2.5 s: figure goes away
    private lateinit var relay: RelayClient
    private lateinit var machine: SessionMachine
    private lateinit var speaker: TtsSpeaker
    private lateinit var gate: SpeechGate
    private lateinit var basePlan: List<PlanItem>
    private var plan by mutableStateOf<List<PlanItem>>(emptyList())
    private val history = HistoryClient(BuildConfig.API_URL)
    private lateinit var homeId: String
    private var sessionId = "s0"
    private var setIdx = 0
    private var week by mutableStateOf<WeekState>(WeekState.Loading)
    private var voice by mutableStateOf(true)       // false when this device has no speech engine: cues show larger
    private var roomCode by mutableStateOf<String?>(null)
    private var guestName by mutableStateOf<String?>(null)
    private var guestPose by mutableStateOf<PoseFrame?>(null)
    private val guestSmoother = PoseSmoother()
    private var guestCount by mutableStateOf(0)
    private var mineDone by mutableStateOf(0)       // my reps in finished sets
    private var guestDone by mutableStateOf(0)      // the guest's reps in earlier sets (folded in when the next set starts)
    private val clearGuestPose = Runnable { guestPose = null; guestSmoother.reset() }
    private var setSeq = 0                  // numbers each set so the phone can ignore repeats of a start message
    private var activeMoveMsg: String? = null
    private var ticks = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("steadyup", MODE_PRIVATE)
        // test hooks: adb shell am start ... --es plan "sit_to_stand:3,heel_raise:3" --ei restSec 2
        val fixedPlan = intent.getStringExtra("plan")  // test hook: a fixed plan ignores the weekly targets
        basePlan = fixedPlan?.let { Catalog.parse(it) } ?: Catalog.defaultPlan()
        plan = basePlan
        val restSec = intent.getIntExtra("restSec", 20)
        // one random id per household; it is the secret inside the family link. `home` extra is a test hook.
        homeId = intent.getStringExtra("home") ?: prefs.getString("home_id", null)
            ?: java.util.UUID.randomUUID().toString().replace("-", "").also { prefs.edit().putString("home_id", it).apply() }
        // test hook: --ez calibrate false skips the two slow stands (scripted tests have no body to learn)
        machine = SessionMachine(plan, restSec, firstRun = !prefs.getBoolean("safety_done", false), needsCalibration = intent.getBooleanExtra("calibrate", true))
        screen = machine.screen
        if (fixedPlan == null) history.fetchPlan(homeId) { t -> runOnUiThread { applyTargets(t) } }
        speaker = TtsSpeaker(this) { ready -> runOnUiThread { voice = ready } }
        gate = SpeechGate(speaker)

        relay = RelayClient(
            BuildConfig.WS_URL,
            onMessage = msgHandler@{ msg ->
                when (msg) {
                    is ServerMsg.Pose -> {
                        relay.send("""{"type":"ack","t":${msg.t}}""") // echo the phone's timestamp so it can measure round trip
                        pose = smoother.update(msg.frame)
                        if (++poseCount % 20 == 1) Log.i("SteadyUpMirror", "poses=$poseCount")
                        handler.removeCallbacks(clearPose); handler.postDelayed(clearPose, 2500)
                        return@msgHandler
                    }
                    is ServerMsg.FromGuest -> {
                        when (val g = msg.inner) {
                            is ServerMsg.Pose -> { guestPose = guestSmoother.update(g.frame); handler.removeCallbacks(clearGuestPose); handler.postDelayed(clearGuestPose, 2500) } // no ack: that is for our own phone
                            is ServerMsg.Rep -> guestCount = g.count
                            else -> {}
                        }
                        return@msgHandler
                    }
                    is ServerMsg.Cal -> { runOnUiThread { if (msg.state == "progress") dispatch(Ev.CalProgress(msg.cycles)) else dispatch(Ev.Calibrated(msg.state == "done")) }; return@msgHandler }
                    is ServerMsg.Room -> { roomCode = msg.code; Log.i(FLOW, "room=${msg.code}"); return@msgHandler }
                    is ServerMsg.Guest -> {
                        guestName = if (msg.joined) msg.name else null
                        if (!msg.joined) { guestPose = null; guestSmoother.reset() }
                        Log.i(FLOW, "guest=${if (msg.joined) msg.name else "none"}"); return@msgHandler
                    }
                    is ServerMsg.Rep -> runOnUiThread { dispatch(Ev.Count(msg.count)) }
                    is ServerMsg.CueMsg -> runOnUiThread { dispatch(Ev.Cue(msg.text)) }
                    is ServerMsg.ViewState -> runOnUiThread { dispatch(if (msg.inView) Ev.InView else Ev.OutOfView) }
                    else -> {}
                }
                val before = pairing
                pairing = PairingReducer.reduce(pairing, msg)
                when (val s = pairing) {
                    is PairingState.ShowCode -> Log.i(RelayClient.TAG, "code=${s.code}") // test hook: read via adb logcat
                    PairingState.Connected -> if (before !is PairingState.Connected) { Log.i(RelayClient.TAG, "state=connected"); splash = true }
                    is PairingState.Problem -> { Log.i(RelayClient.TAG, "state=problem"); runOnUiThread { dispatch(Ev.PhoneLost) } }
                    else -> {}
                }
            },
            onLost = { pairing = PairingReducer.connectionLost(pairing) },
        )

        setContent {
            // a ticking clock drives rest countdowns, cue fade-out and the 10 second out-of-view pause
            LaunchedEffect(Unit) { while (true) { delay(250); dispatch(Ev.Tick) } }
            LaunchedEffect(pairing, splash) { if (pairing is PairingState.Connected && splash) { delay(1800); splash = false } }
            val sessionVisible = pairing is PairingState.Connected && !splash
            LaunchedEffect(sessionVisible, screen.logName()) { if (sessionVisible) Log.i(FLOW, "shown=${screen.logName()}") } // test hook: screen is on the glass
            BackHandler(enabled = screen !is Screen.Home && screen !is Screen.Safety && pairing is PairingState.Connected) { dispatch(Ev.Back) }
            if (pairing !is PairingState.Connected || splash) PairScreen(pairing) { relay.start() }
            else {
                val live = screen as? Screen.Live
                val together = guestName?.let { TogetherView(it, guestPose, mineDone + guestDone + (live?.count ?: 0) + guestCount) }
                LaunchedEffect(together?.total) { together?.let { Log.i(FLOW, "together=${it.total}") } }
                LaunchedEffect(live != null && pose != null && guestPose != null) { if (live != null && pose != null && guestPose != null) Log.i(FLOW, "figures=2") }
                SessionScreen(screen, pose, plan, week, WeekText.familyLink(BuildConfig.WEB_URL, homeId), together, voice, roomCode, "${BuildConfig.WEB_URL.trimEnd('/')}/together.html?room=${roomCode ?: ""}", ::dispatch)
            }
        }
        relay.start()
        Log.i(FLOW, "screen=${screen.logName()}")
    }

    private fun applyTargets(targets: Map<String, Int>) {
        val next = Catalog.withTargets(basePlan, targets)
        if (machine.updatePlan(next)) plan = next
    }

    private fun dispatch(ev: Ev) {
        val now = SystemClock.elapsedRealtime()
        val before = screen.logName()
        gate.tick(now)
        // a start message can be lost on the way: repeat it every 2 s while the set is live (phone ignores repeats by seq)
        if (ev == Ev.Tick && screen is Screen.Live && activeMoveMsg != null && ++ticks % 8 == 0) relay.send(activeMoveMsg!!)
        val fx = machine.on(ev, now)
        screen = machine.screen
        if (screen.logName() != before) {
            Log.i(FLOW, "screen=${screen.logName()}")
            if (screen is Screen.Finish && intent.getStringExtra("plan") == null) // after a session: ask for next week's plan, then pick it up
                history.refreshPlan(homeId) { history.fetchPlan(homeId) { t -> runOnUiThread { applyTargets(t) } } }
            (screen as? Screen.Finish)?.let { f -> Log.i(FLOW, "totals=" + f.totals.joinToString(",") { "${it.first}:${it.second}" }) }
        }
        for (f in fx) when (f) {
            is Fx.Speak -> gate.say(f.text, now, f.force)
            is Fx.StartSet -> {
                activeMoveMsg = JSONObject().put("type", "move").put("move", f.item.move).put("target", f.item.target)
                    .put("side", f.item.side ?: JSONObject.NULL).put("seq", ++setSeq).toString()
                relay.send(activeMoveMsg!!)
                guestDone += guestCount; guestCount = 0
                if (roomCode != null) relay.send(JSONObject().put("type", "room-broadcast").put("msg", JSONObject(activeMoveMsg!!)).toString())
            }
            Fx.EndSet -> {
                activeMoveMsg = null; relay.send("""{"type":"state","state":"set-end"}""")
                if (roomCode != null) relay.send("""{"type":"room-broadcast","msg":{"type":"state","state":"set-end"}}""")
            }
            Fx.StartCalibration -> relay.send("""{"type":"calibrate"}""")
            Fx.StopCalibration -> relay.send("""{"type":"state","state":"set-end"}""")
            is Fx.SaveChair -> { Log.i(FLOW, "chair=${f.score}"); history.recordSet(JSONObject().put("home", homeId).put("session", "chair" + System.currentTimeMillis().toString(36)).put("idx", 0).put("move", "chair_stand_30").put("target", 30).put("done", f.score.coerceIn(0, 60)).put("cues", 0).put("day", java.time.LocalDate.now().toString()).put("ts", System.currentTimeMillis())) }
            Fx.OpenRoom -> { roomCode = null; guestName = null; guestPose = null; mineDone = 0; guestDone = 0; guestCount = 0; relay.send("""{"type":"room-open"}""") }
            Fx.SessionStart -> { sessionId = java.util.UUID.randomUUID().toString().replace("-", "").take(16); setIdx = 0 }
            Fx.OpenWeek -> {
                week = WeekState.Loading
                history.fetchSummary(homeId, java.time.LocalDate.now().toString()) { st ->
                    runOnUiThread { week = st; (st as? WeekState.Loaded)?.let { Log.i(FLOW, "week=sessions:${it.summary.weekSessions},streak:${it.summary.streak}") } }
                }
            }
            is Fx.RecordSet -> { mineDone += f.done; history.recordSet(JSONObject()   // counts only: no body points exist on this path
                .put("home", homeId).put("session", sessionId).put("idx", setIdx++).put("move", f.item.move)
                .apply { f.item.side?.let { put("side", it) } }
                .put("target", f.item.target).put("done", f.done.coerceIn(0, 60)).put("cues", f.cues)
                .put("day", java.time.LocalDate.now().toString()).put("ts", System.currentTimeMillis())) }
            Fx.SafetyDone -> getSharedPreferences("steadyup", MODE_PRIVATE).edit().putBoolean("safety_done", true).apply()
        }
    }

    override fun onDestroy() { relay.close(); speaker.shutdown(); super.onDestroy() }
    companion object { const val FLOW = "SteadyUpFlow" }
}

@Composable
fun SessionScreen(screen: Screen, pose: PoseFrame?, plan: List<PlanItem>, week: WeekState, familyLink: String, together: TogetherView?, voice: Boolean, roomCode: String?, togetherLink: String, dispatch: (Ev) -> Unit) {
    when (val s = screen) {
        Screen.Safety -> SafetyScreen { dispatch(Ev.Ok) }
        Screen.Home -> HomeScreen({ dispatch(Ev.Ok) }, { dispatch(Ev.OpenWeek) }, { dispatch(Ev.OpenTogether) }, { dispatch(Ev.OpenChair) })
        is Screen.Calibrate -> CalibrateScreen(s.cycles, s.retry, pose) { dispatch(Ev.Ok) }
        Screen.ChairAsk -> ChairAskScreen({ dispatch(Ev.Yes) }, { dispatch(Ev.No) })
        Screen.ChairNo -> ChairNoScreen { dispatch(Ev.Ok) }
        is Screen.ChairAbout -> ChairAboutScreen(s.age, s.sex, { dispatch(Ev.CycleAge) }, { dispatch(Ev.CycleSex) }) { dispatch(Ev.Ok) }
        is Screen.ChairHow -> ChairHowScreen { dispatch(Ev.Ok) }
        is Screen.ChairReady -> ChairReadyScreen(s.n)
        is Screen.ChairGo -> ChairGoScreen(s.count, s.left, s.cue, pose, voice)
        is Screen.ChairResult -> ChairResultScreen(s.score, s.age, s.sex) { dispatch(Ev.Ok) }
        Screen.Together -> TogetherScreen(roomCode, together?.name, togetherLink) { dispatch(Ev.Ok) }
        Screen.Week -> WeekScreen(week, familyLink) { dispatch(Ev.Ok) }
        is Screen.Intro -> IntroScreen(plan[s.i]) { dispatch(Ev.Ok) }
        is Screen.Live -> LiveScreen(plan[s.i], s.count, s.cue, pose, together, s.i + 1, plan.size, voice)
        is Screen.Paused -> PausedScreen { dispatch(Ev.Ok) }
        is Screen.Rest -> RestScreen(plan[s.next], s.secondsLeft) { dispatch(Ev.Ok) }
        is Screen.Finish -> FinishScreen(s.totals) { dispatch(Ev.Ok) }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PairScreen(state: PairingState, restart: () -> Unit) {
    // Ask for a fresh number a little before the old one runs out, and retry after a problem.
    LaunchedEffect(state) {
        when (state) {
            is PairingState.ShowCode -> { delay((state.expiresInSec - 10) * 1000L); restart() }
            is PairingState.Problem -> { delay(4000); restart() }
            else -> {}
        }
    }
    Column(
        Modifier.fillMaxSize().background(Color(0xFF101820)).padding(48.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        when (state) {
            PairingState.Connecting -> Text(Sentences.CONNECTING, fontSize = 48.sp, color = Color.White)
            is PairingState.ShowCode -> Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                QrView(PairingReducer.joinLink(BuildConfig.WEB_URL, state.code), 270.dp)
                Spacer(Modifier.width(24.dp))
                Column(Modifier.weight(1f)) {
                    Text(Sentences.SCAN, fontSize = 48.sp, color = Color.White)
                    Spacer(Modifier.height(32.dp))
                    Text(Sentences.OR_TYPE, fontSize = 40.sp, color = Color(0xFFBFD7EA))
                    Text(PairingReducer.spaced(state.code), fontSize = 80.sp, fontWeight = FontWeight.Bold, softWrap = false,
                        fontFamily = FontFamily.Monospace, color = Color.White)
                    Spacer(Modifier.height(16.dp))
                    Text(BuildConfig.WEB_URL.removePrefix("https://"), fontSize = 46.sp, color = Color(0xFFBFD7EA))
                }
            }
            PairingState.Connected -> {
                Text(Sentences.CONNECTED, fontSize = 96.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7BDC8F))
                Text(Sentences.PHONE_READY, fontSize = 48.sp, color = Color.White)
            }
            is PairingState.Problem -> Text(state.sentence, fontSize = 48.sp, color = Color(0xFFFFB4A2))
        }
    }
}
