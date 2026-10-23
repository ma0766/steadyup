package com.steadyup.tv

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
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

class MainActivity : ComponentActivity() {
    private var state by mutableStateOf<PairingState>(PairingState.Connecting)
    private var pose by mutableStateOf<PoseFrame?>(null)
    private val smoother = PoseSmoother()
    private var poseCount = 0
    private val handler = Handler(Looper.getMainLooper())
    private val clearPose = Runnable { pose = null; smoother.reset() } // no body points for 2.5 s: back to the plain screen
    private lateinit var relay: RelayClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        relay = RelayClient(
            BuildConfig.WS_URL,
            onMessage = msgHandler@{ msg ->
                if (msg is ServerMsg.Pose) {
                    relay.send("""{"type":"ack","t":${msg.t}}""") // echo the phone's timestamp so it can measure round trip
                    pose = smoother.update(msg.frame)
                    if (++poseCount % 20 == 1) Log.i("SteadyUpMirror", "poses=$poseCount")
                    handler.removeCallbacks(clearPose); handler.postDelayed(clearPose, 2500)
                    return@msgHandler
                }
                state = PairingReducer.reduce(state, msg)
                when (val s = state) {
                    is PairingState.ShowCode -> Log.i(RelayClient.TAG, "code=${s.code}") // test hook: read via adb logcat
                    PairingState.Connected -> Log.i(RelayClient.TAG, "state=connected")
                    is PairingState.Problem -> Log.i(RelayClient.TAG, "state=problem")
                    else -> {}
                }
            },
            onLost = { state = PairingReducer.connectionLost(state) },
        )
        setContent { PairScreen(state, pose) { relay.start() } }
        relay.start()
    }

    override fun onDestroy() { relay.close(); super.onDestroy() }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PairScreen(state: PairingState, pose: PoseFrame?, restart: () -> Unit) {
    // Mirror: once the phone sends body points, the figure takes over the whole screen.
    if (state is PairingState.Connected && pose != null) { StickFigure(pose, Modifier.fillMaxSize().background(Color(0xFF101820))); return }
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
