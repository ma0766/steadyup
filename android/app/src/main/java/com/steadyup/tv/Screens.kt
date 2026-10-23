package com.steadyup.tv

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import androidx.tv.material3.Border
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Surface
import androidx.tv.material3.Text

// Design: dark background, high contrast, text >= 40 sp, one main action per screen, 8 dp white focus ring.
object Ink {
    val bg = Color(0xFF101820)
    val text = Color.White
    val soft = Color(0xFFBFD7EA)
    val good = Color(0xFF7BDC8F)
    val warn = Color(0xFFFFD166)
    val button = Color(0xFF5FA8D3)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun BigButton(label: String, onClick: () -> Unit, autoFocus: Boolean = true) {
    val focus = remember { FocusRequester() }
    var focused by remember { mutableStateOf(false) }
    // The remote's OK press must land on this button with no arrow keys. Focus can fail while the screen is still
    // being laid out, so keep asking (up to ~3 s) until it sticks.
    LaunchedEffect(Unit) {
        if (!autoFocus) return@LaunchedEffect
        repeat(30) { if (!focused) { runCatching { focus.requestFocus() }; delay(100) } }
    }
    Surface(
        onClick = onClick,
        modifier = Modifier.focusRequester(focus).onFocusChanged { focused = it.isFocused },
        shape = ClickableSurfaceDefaults.shape(RoundedCornerShape(20.dp)),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = Ink.button, contentColor = Ink.bg,
            focusedContainerColor = Color(0xFFBFE3F7), focusedContentColor = Ink.bg,
        ),
        border = ClickableSurfaceDefaults.border(focusedBorder = Border(BorderStroke(8.dp, Color.White))),
    ) {
        Text(label, fontSize = 48.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 56.dp, vertical = 24.dp))
    }
}

@Composable
private fun Page(content: @Composable () -> Unit) {
    Column(
        Modifier.fillMaxSize().background(Ink.bg).padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) { content() }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SafetyScreen(onOk: () -> Unit) = Page {
    Text(Sentences.SAFETY_1, fontSize = 56.sp, color = Ink.text, textAlign = TextAlign.Center)
    Spacer(Modifier.height(24.dp))
    Text(Sentences.SAFETY_2, fontSize = 56.sp, color = Ink.warn, textAlign = TextAlign.Center)
    Spacer(Modifier.height(48.dp))
    BigButton(Sentences.SAFETY_OK, onOk)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun HomeScreen(onStart: () -> Unit, onWeek: () -> Unit, onTogether: () -> Unit) = Page {
    Text(AppInfo.NAME, fontSize = 72.sp, fontWeight = FontWeight.Bold, color = Ink.text)
    Text(Sentences.HOME_HELLO, fontSize = 48.sp, color = Ink.soft)
    Spacer(Modifier.height(40.dp))
    BigButton(Sentences.HOME_START, onStart)           // first button has focus; arrow down reaches the next one
    Spacer(Modifier.height(20.dp))
    BigButton(Sentences.HOME_TOGETHER, onTogether, autoFocus = false)
    Spacer(Modifier.height(20.dp))
    BigButton(Sentences.HOME_WEEK, onWeek, autoFocus = false)
}

/** What the live screen needs when family has joined. */
data class TogetherView(val name: String, val pose: PoseFrame?, val total: Int)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TogetherScreen(roomCode: String?, guestName: String?, joinLink: String, onStart: () -> Unit) = Page {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(Sentences.TOGETHER_TITLE, fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Text(Sentences.TOGETHER_SCAN, fontSize = 40.sp, color = Ink.soft)
            if (roomCode != null) Text(PairingReducer.spaced(roomCode), fontSize = 80.sp, fontWeight = FontWeight.Bold, softWrap = false, fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace, color = Ink.text)
            Spacer(Modifier.height(8.dp))
            Text(if (guestName != null) "$guestName is here." else Sentences.TOGETHER_WAIT, fontSize = 44.sp, color = if (guestName != null) Ink.good else Ink.warn)
            Spacer(Modifier.height(12.dp))
            BigButton(Sentences.TOGETHER_START, onStart)
        }
        Spacer(Modifier.width(32.dp))
        if (roomCode != null) QrView(joinLink, 260.dp)
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun WeekScreen(state: WeekState, familyLink: String, onBack: () -> Unit) = Page {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(Sentences.WEEK_TITLE, fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Spacer(Modifier.height(4.dp))
            when (state) {
                WeekState.Loading -> Text(Sentences.WEEK_LOADING, fontSize = 44.sp, color = Ink.soft)
                WeekState.Failed -> Text(Sentences.WEEK_PROBLEM, fontSize = 44.sp, color = Ink.warn)
                is WeekState.Loaded -> {
                    Text(WeekText.sessions(state.summary), fontSize = 42.sp, color = Ink.good, fontWeight = FontWeight.Bold)
                    Text(WeekText.streak(state.summary), fontSize = 40.sp, color = Ink.text)
                    if (state.summary.last.isNotEmpty()) {
                        Spacer(Modifier.height(4.dp))
                        Text(Sentences.WEEK_LAST, fontSize = 40.sp, color = Ink.soft)
                        for (line in state.summary.last.take(3)) Text(line, fontSize = 40.sp, color = Ink.text)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            BigButton(Sentences.FINISH_OK, onBack)
        }
        Spacer(Modifier.width(32.dp))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            QrView(familyLink, 260.dp)
            Spacer(Modifier.height(12.dp))
            Text(Sentences.WEEK_FAMILY, fontSize = 40.sp, color = Ink.soft, textAlign = TextAlign.Center)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun IntroScreen(item: PlanItem, onReady: () -> Unit) = Page {
    Row(verticalAlignment = Alignment.CenterVertically) {
        StickFigure(MovePicture.standing, Modifier.width(300.dp).height(330.dp))
        Spacer(Modifier.width(48.dp))
        Column(Modifier.width(900.dp)) {
            Text(item.title, fontSize = 56.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Spacer(Modifier.height(8.dp))
            Text(item.sentence, fontSize = 40.sp, color = Ink.soft)
            Spacer(Modifier.height(12.dp))
            Text(Sentences.HOLD_CHAIR, fontSize = 44.sp, color = Ink.warn, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            BigButton(Sentences.INTRO_GO, onReady)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun LiveScreen(item: PlanItem, count: Int, cue: String?, pose: PoseFrame?, together: TogetherView? = null) {
    Row(Modifier.fillMaxSize().background(Ink.bg).padding(32.dp), verticalAlignment = Alignment.CenterVertically) {
        if (together == null) Column(Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.Center) {
            if (pose != null) StickFigure(pose, Modifier.fillMaxSize())
            else Text(Sentences.STEP_BACK, fontSize = 44.sp, color = Ink.warn)
        } else Row(Modifier.weight(1f).fillMaxHeight()) {
            // two people, side by side, each with a name under their figure
            for ((label, p, tint) in listOf(Triple(Sentences.YOU, pose, Ink.good), Triple(together.name, together.pose, Ink.warn))) Column(Modifier.weight(1f).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
                Box(Modifier.weight(1f).fillMaxWidth()) { if (p != null) StickFigure(p, Modifier.fillMaxSize(), color = tint) }
                Text(label, fontSize = 44.sp, fontWeight = FontWeight.Bold, color = tint)
            }
        }
        Column(Modifier.width(560.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(item.title, fontSize = 44.sp, color = Ink.soft, textAlign = TextAlign.Center)
            Text("$count", fontSize = 220.sp, fontWeight = FontWeight.Bold, color = Ink.good)
            Text("${Sentences.OF} ${item.target}" + if (item.isHold) " seconds" else "", fontSize = 56.sp, color = Ink.text)
            if (together != null) Text("${Sentences.TOGETHER_TOTAL} ${together.total}", fontSize = 56.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Spacer(Modifier.height(32.dp))
            Text(cue ?: "", fontSize = 44.sp, color = Ink.warn, textAlign = TextAlign.Center, minLines = 2)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PausedScreen(onOk: () -> Unit) = Page {
    Text(Sentences.PAUSED, fontSize = 64.sp, color = Ink.warn, textAlign = TextAlign.Center)
    Spacer(Modifier.height(48.dp))
    BigButton("OK", onOk)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun RestScreen(next: PlanItem, secondsLeft: Int, onSkip: () -> Unit) = Page {
    Text(Sentences.REST, fontSize = 56.sp, color = Ink.soft)
    Text("$secondsLeft", fontSize = 120.sp, fontWeight = FontWeight.Bold, color = Ink.good)
    Text("${Sentences.NEXT_UP} ${next.title}", fontSize = 48.sp, color = Ink.text, textAlign = TextAlign.Center)
    Spacer(Modifier.height(16.dp))
    BigButton(Sentences.REST_SKIP, onSkip)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun FinishScreen(totals: List<Pair<String, Int>>, onDone: () -> Unit) = Page {
    Text(Sentences.FINISH_TITLE, fontSize = 64.sp, fontWeight = FontWeight.Bold, color = Ink.good)
    Spacer(Modifier.height(8.dp))
    for ((title, n) in totals) Text("$title: $n", fontSize = 40.sp, color = Ink.text)
    Spacer(Modifier.height(8.dp))
    Text(Sentences.WELL_DONE.substringAfter(". "), fontSize = 48.sp, color = Ink.soft)
    Spacer(Modifier.height(16.dp))
    BigButton(Sentences.FINISH_OK, onDone)
}
