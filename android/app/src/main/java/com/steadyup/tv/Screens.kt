package com.steadyup.tv

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
fun BigButton(label: String, onClick: () -> Unit) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() } // the remote's OK press lands here with no arrow keys needed
    Surface(
        onClick = onClick,
        modifier = Modifier.focusRequester(focus),
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
fun HomeScreen(onStart: () -> Unit) = Page {
    Text(AppInfo.NAME, fontSize = 72.sp, fontWeight = FontWeight.Bold, color = Ink.text)
    Text(Sentences.HOME_HELLO, fontSize = 48.sp, color = Ink.soft)
    Spacer(Modifier.height(48.dp))
    BigButton(Sentences.HOME_START, onStart)
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
fun LiveScreen(item: PlanItem, count: Int, cue: String?, pose: PoseFrame?) {
    Row(Modifier.fillMaxSize().background(Ink.bg).padding(32.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.Center) {
            if (pose != null) StickFigure(pose, Modifier.fillMaxSize())
            else Text(Sentences.STEP_BACK, fontSize = 44.sp, color = Ink.warn)
        }
        Column(Modifier.width(560.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(item.title, fontSize = 44.sp, color = Ink.soft, textAlign = TextAlign.Center)
            Text("$count", fontSize = 220.sp, fontWeight = FontWeight.Bold, color = Ink.good)
            Text("${Sentences.OF} ${item.target}" + if (item.isHold) " seconds" else "", fontSize = 56.sp, color = Ink.text)
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
