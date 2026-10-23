package com.steadyup.tv

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
fun BigButton(label: String, onClick: () -> Unit, autoFocus: Boolean = true, fontSp: Int = 48, modifier: Modifier = Modifier, fixedSize: Boolean = false) {
    val focus = remember { FocusRequester() }
    var focused by remember { mutableStateOf(false) }
    // The remote's OK press must land on this button with no arrow keys. Focus can fail while the screen is still
    // being laid out, so keep asking (up to ~3 s) until it sticks.
    LaunchedEffect(Unit) {
        if (!autoFocus) return@LaunchedEffect
        repeat(30) { if (!focused) { runCatching { focus.requestFocus() }; delay(100) } }
    }
    val shape = RoundedCornerShape(20.dp)
    Surface(
        onClick = onClick,
        // hasFocus (not isFocused): the real focusable lives inside Surface, below this modifier. Knowing it has focus
        // stops the retry loop above; asking again every 100 ms kept resetting Surface's own focus ring.
        // We draw the one focus ring and the lighter fill from that state, so focus is visible however it arrived.
        modifier = modifier.focusRequester(focus).onFocusChanged { focused = it.hasFocus }
            .then(if (focused) Modifier.border(BorderStroke(8.dp, Color.White), shape) else Modifier),
        shape = ClickableSurfaceDefaults.shape(shape),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = if (focused) Color(0xFFBFE3F7) else Ink.button, contentColor = Ink.bg,
            focusedContainerColor = Color(0xFFBFE3F7), focusedContentColor = Ink.bg,
        ),
        border = ClickableSurfaceDefaults.border(focusedBorder = Border.None),
        scale = ClickableSurfaceDefaults.scale(focusedScale = 1f),  // the ring and fill show focus; growing would push into neighbours and the safe margin
    ) {
        // the Surface's content box passes its size down, so a fixed-size button centres its label
        Box(if (fixedSize) Modifier.fillMaxSize() else Modifier, contentAlignment = Alignment.Center) {
            Text(label, fontSize = fontSp.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = if (fontSp < 48) 24.dp else 48.dp, vertical = if (fontSp < 48) 14.dp else 24.dp))
        }
    }
}

@Composable
private fun Page(content: @Composable () -> Unit) {
    Column(
        Modifier.fillMaxSize().background(Ink.bg).padding(horizontal = 48.dp, vertical = 36.dp),
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
fun HomeScreen(onStart: () -> Unit, onWeek: () -> Unit, onTogether: () -> Unit, onChair: () -> Unit) = Page {
    Text(AppInfo.NAME, fontSize = 64.sp, fontWeight = FontWeight.Bold, color = Ink.text)
    Text(Sentences.HOME_HELLO, fontSize = 40.sp, color = Ink.soft)
    Spacer(Modifier.height(20.dp))
    // 2 x 2 grid so every choice fits on a 1080p TV. Arrow keys move between them; the first has focus.
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
        BigButton(Sentences.HOME_START, onStart, fontSp = 40, modifier = Modifier.width(410.dp).height(124.dp), fixedSize = true)
        BigButton(Sentences.HOME_TOGETHER, onTogether, autoFocus = false, fontSp = 40, modifier = Modifier.width(410.dp).height(124.dp), fixedSize = true)
    }
    Spacer(Modifier.height(16.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
        BigButton(Sentences.HOME_WEEK, onWeek, autoFocus = false, fontSp = 40, modifier = Modifier.width(410.dp).height(124.dp), fixedSize = true)
        BigButton(Sentences.CHAIR_BUTTON, onChair, autoFocus = false, fontSp = 40, modifier = Modifier.width(410.dp).height(124.dp), fixedSize = true)
    }
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
fun LiveScreen(item: PlanItem, count: Int, cue: String?, pose: PoseFrame?, together: TogetherView? = null, setNo: Int = 1, setTotal: Int = 1, voice: Boolean = true) {
    Column(Modifier.fillMaxSize().background(Ink.bg).padding(horizontal = 48.dp, vertical = 30.dp)) {
        // top: where we are in the session, and the move
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Move $setNo ${Sentences.OF} $setTotal", fontSize = 44.sp, color = Ink.soft)
            Spacer(Modifier.width(24.dp))
            Text(item.title, fontSize = 44.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            if (together != null) {
                Spacer(Modifier.weight(1f))
                Text("${Sentences.TOGETHER_TOTAL} ${together.total}", fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.warn)
            }
        }
        Row(Modifier.weight(1f).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
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
            Column(Modifier.width(440.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("$count", fontSize = 160.sp, fontWeight = FontWeight.Bold, color = Ink.good)
                Text("${Sentences.OF} ${item.target}" + if (item.isHold) " seconds" else "", fontSize = 48.sp, color = Ink.text)
                Spacer(Modifier.height(12.dp))
                // fill bar: how far through this set
                Box(Modifier.fillMaxWidth().height(20.dp).background(Color(0xFF5B7388), RoundedCornerShape(10.dp))) {
                    Box(Modifier.fillMaxWidth((count.toFloat() / item.target).coerceIn(0f, 1f)).fillMaxHeight().background(Ink.good, RoundedCornerShape(10.dp)))
                }
            }
        }
        // bottom banner: the form cue when there is one, otherwise what to do. With no voice on this TV, cues are bigger.
        Box(Modifier.fillMaxWidth().height(if (voice) 84.dp else 104.dp).background(Color(0xFF1B2A38), RoundedCornerShape(16.dp)).padding(horizontal = 24.dp), contentAlignment = Alignment.Center) {
            Text(cue ?: item.sentence, fontSize = cueSp(voice, cue != null).sp, fontWeight = if (cue != null) FontWeight.Bold else FontWeight.Normal,
                color = if (cue != null) Ink.warn else Ink.soft, textAlign = TextAlign.Center, maxLines = 1)
        }
    }
}

/** Text size of the bottom banner. A cue is always loud; with no voice on the device it is larger still. */
fun cueSp(voice: Boolean, isCue: Boolean): Int = if (!isCue) 40 else if (voice) 52 else 64

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
    Text(Sentences.FINISH_TITLE, fontSize = 60.sp, fontWeight = FontWeight.Bold, color = Ink.good)
    Spacer(Modifier.height(4.dp))
    // two columns so six totals plus the button always fit on the screen
    Row(horizontalArrangement = Arrangement.spacedBy(48.dp)) {
        for (half in totals.chunked((totals.size + 1) / 2)) Column {
            for ((title, n) in half) Text("$title: $n", fontSize = 40.sp, color = Ink.text)
        }
    }
    Spacer(Modifier.height(6.dp))
    Text(Sentences.WELL_DONE.substringAfter(". "), fontSize = 44.sp, color = Ink.soft)
    Spacer(Modifier.height(12.dp))
    BigButton(Sentences.FINISH_OK, onDone, fontSp = 44)
}


@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun CalibrateScreen(cycles: Int, retry: Boolean, pose: PoseFrame?, onSkip: () -> Unit) = Page {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.width(420.dp).height(380.dp)) { if (pose != null) StickFigure(pose, Modifier.fillMaxSize()) }
        Spacer(Modifier.width(24.dp))
        Column(Modifier.weight(1f)) {
            Text(if (retry) Sentences.CAL_AGAIN else Sentences.CAL_TITLE, fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Spacer(Modifier.height(8.dp))
            Text(Sentences.CAL_STEP, fontSize = 44.sp, color = Ink.soft)
            Text(Sentences.CAL_TWICE, fontSize = 44.sp, color = Ink.soft)
            Spacer(Modifier.height(12.dp))
            Text("$cycles ${Sentences.OF} 2", fontSize = 72.sp, fontWeight = FontWeight.Bold, color = Ink.good)
            Spacer(Modifier.height(12.dp))
            BigButton(Sentences.CAL_SKIP, onSkip, fontSp = 44)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ChairAskScreen(onYes: () -> Unit, onNo: () -> Unit) = Page {
    Text(Sentences.CHAIR_BUTTON, fontSize = 44.sp, color = Ink.soft)
    Spacer(Modifier.height(8.dp))
    Text(Sentences.CHAIR_ASK, fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.text, textAlign = TextAlign.Center)
    Spacer(Modifier.height(32.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(32.dp)) {
        BigButton(Sentences.YES, onYes)
        BigButton(Sentences.NO, onNo, autoFocus = false)
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ChairNoScreen(onOk: () -> Unit) = Page {
    Text(Sentences.CHAIR_SKIP_1, fontSize = 56.sp, color = Ink.text, textAlign = TextAlign.Center)
    Spacer(Modifier.height(32.dp))
    BigButton(Sentences.FINISH_OK, onOk)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ChairAboutScreen(age: Int, sex: Int, onAge: () -> Unit, onSex: () -> Unit, onNext: () -> Unit) = Page {
    Text(Sentences.CHAIR_ABOUT, fontSize = 48.sp, color = Ink.text, textAlign = TextAlign.Center)
    Text(Sentences.CHAIR_HINT, fontSize = 40.sp, color = Ink.soft, textAlign = TextAlign.Center)
    Spacer(Modifier.height(12.dp))
    BigButton("Age: ${Cdc.AGE_LABELS[age]}", onAge, fontSp = 44)          // OK changes the choice; arrow down moves on
    Spacer(Modifier.height(12.dp))
    BigButton("Sex: ${Cdc.SEX_LABELS[sex]}", onSex, autoFocus = false, fontSp = 44)
    Spacer(Modifier.height(12.dp))
    BigButton(Sentences.NEXT, onNext, autoFocus = false, fontSp = 44)
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ChairHowScreen(onReady: () -> Unit) = Page {
    Text(Sentences.CHAIR_BUTTON, fontSize = 52.sp, fontWeight = FontWeight.Bold, color = Ink.text)
    Spacer(Modifier.height(8.dp))
    for (line in listOf(Sentences.CHAIR_HOW_1, Sentences.CHAIR_HOW_2, Sentences.CHAIR_HOW_3, Sentences.CHAIR_HOW_4, Sentences.CHAIR_HOW_5, Sentences.CHAIR_HOW_6))
        Text(line, fontSize = 40.sp, color = Ink.soft, textAlign = TextAlign.Center)
    Spacer(Modifier.height(14.dp))
    BigButton(Sentences.INTRO_GO, onReady, fontSp = 44)
}

@Composable
fun ChairReadyScreen(n: Int) = Page {
    Text(Sentences.CHAIR_GET_READY, fontSize = 64.sp, color = Ink.soft)
    Text("$n", fontSize = 220.sp, fontWeight = FontWeight.Bold, color = Ink.good)
    Text(Sentences.CHAIR_HOW_4, fontSize = 44.sp, color = Ink.warn)
}

@Composable
fun ChairGoScreen(count: Int, left: Int, cue: String?, pose: PoseFrame?, voice: Boolean) {
    Column(Modifier.fillMaxSize().background(Ink.bg).padding(horizontal = 48.dp, vertical = 30.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(Sentences.CHAIR_BUTTON, fontSize = 44.sp, fontWeight = FontWeight.Bold, color = Ink.text)
            Spacer(Modifier.width(24.dp))
            Text("$left seconds", fontSize = 56.sp, fontWeight = FontWeight.Bold, color = Ink.warn)
        }
        Row(Modifier.weight(1f).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.Center) {
                if (pose != null) StickFigure(pose, Modifier.fillMaxSize()) else Text(Sentences.STEP_BACK, fontSize = 44.sp, color = Ink.warn)
            }
            Column(Modifier.width(440.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("$count", fontSize = 200.sp, fontWeight = FontWeight.Bold, color = Ink.good)
                Text("stands", fontSize = 48.sp, color = Ink.text)
            }
        }
        Box(Modifier.fillMaxWidth().height(if (voice) 84.dp else 104.dp).background(Color(0xFF1B2A38), RoundedCornerShape(16.dp)).padding(horizontal = 24.dp), contentAlignment = Alignment.Center) {
            Text(cue ?: Sentences.CHAIR_HOW_5, fontSize = cueSp(voice, cue != null).sp, fontWeight = if (cue != null) FontWeight.Bold else FontWeight.Normal,
                color = if (cue != null) Ink.warn else Ink.soft, textAlign = TextAlign.Center, maxLines = 1)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ChairResultScreen(score: Int, age: Int, sex: Int, onOk: () -> Unit) = Page {
    Text(Sentences.CHAIR_SCORE, fontSize = 44.sp, color = Ink.soft)
    Text("$score", fontSize = 110.sp, fontWeight = FontWeight.Bold, color = Ink.good)
    Text(Sentences.CHAIR_STANDS, fontSize = 44.sp, color = Ink.text)
    Spacer(Modifier.height(8.dp))
    for (line in Cdc.lines(age, sex)) Text(line, fontSize = 40.sp, color = Ink.warn, textAlign = TextAlign.Center)
    Spacer(Modifier.height(14.dp))
    BigButton(Sentences.FINISH_OK, onOk, fontSp = 44)
}
