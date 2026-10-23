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
    private lateinit var plan: List<PlanItem>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("steadyup", MODE_PRIVATE)
        // test hooks: adb shell am start ... --es plan "sit_to_stand:3,heel_raise:3" --ei restSec 2
        plan = intent.getStringExtra("plan")?.let { Catalog.parse(it) } ?: Catalog.defaultPlan()
        val restSec = intent.getIntExtra("restSec", 20)
        machine = SessionMachine(plan, restSec, firstRun = !prefs.getBoolean("safety_done", false))
        screen = machine.screen
        speaker = TtsSpeaker(this)
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
            else SessionScreen(screen, pose, plan, ::dispatch)
        }
        relay.start()
        Log.i(FLOW, "screen=${screen.logName()}")
    }

    private fun dispatch(ev: Ev) {
        val now = SystemClock.elapsedRealtime()
        val before = screen.logName()
        gate.tick(now)
        val fx = machine.on(ev, now)
        screen = machine.screen
        if (screen.logName() != before) {
            Log.i(FLOW, "screen=${screen.logName()}")
            (screen as? Screen.Finish)?.let { f -> Log.i(FLOW, "totals=" + f.totals.joinToString(",") { "${it.first}:${it.second}" }) }
        }
        for (f in fx) when (f) {
            is Fx.Speak -> gate.say(f.text, now, f.force)
            is Fx.StartSet -> relay.send(JSONObject().put("type", "move").put("move", f.item.move).put("target", f.item.target)
                .put("side", f.item.side ?: JSONObject.NULL).toString())
            Fx.EndSet -> relay.send("""{"type":"state","state":"set-end"}""")
            Fx.SafetyDone -> getSharedPreferences("steadyup", MODE_PRIVATE).edit().putBoolean("safety_done", true).apply()
        }
    }

    override fun onDestroy() { relay.close(); speaker.shutdown(); super.onDestroy() }
    companion object { const val FLOW = "SteadyUpFlow" }
}

@Composable
fun SessionScreen(screen: Screen, pose: PoseFrame?, plan: List<PlanItem>, dispatch: (Ev) -> Unit) {
    when (val s = screen) {
        Screen.Safety -> SafetyScreen { dispatch(Ev.Ok) }
        Screen.Home -> HomeScreen { dispatch(Ev.Ok) }
        is Screen.Intro -> IntroScreen(plan[s.i]) { dispatch(Ev.Ok) }
        is Screen.Live -> LiveScreen(plan[s.i], s.count, s.cue, pose)
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
                    Text(BuildConfig.WEB_URL.removePrefix("https://"), fontSize = 40.sp, color = Color(0xFFBFD7EA))
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
