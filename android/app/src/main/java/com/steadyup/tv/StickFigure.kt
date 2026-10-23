package com.steadyup.tv

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import kotlin.math.abs
import kotlin.math.min

// Draws the body points as a stick figure. Canvas is immediate-mode: redrawn whenever `pose` changes.
@Composable
fun StickFigure(pose: PoseFrame, modifier: Modifier = Modifier.fillMaxSize(), color: Color = Color(0xFF7BDC8F)) {
    Canvas(modifier) {
        // keep the phone camera's 4:3 shape so arms and legs are not stretched
        val h = size.height
        val w = min(size.width, h * 4f / 3f)
        val left = (size.width - w) / 2f
        fun pt(i: Int) = Offset(left + Skeleton.mirrorX(pose.x[i]) * w, pose.y[i] * h)
        val stroke = h * 0.014f
        for ((a, b) in Skeleton.BONES) if (pose.visible(a) && pose.visible(b))
            drawLine(color, pt(a), pt(b), strokeWidth = stroke, cap = StrokeCap.Round)
        if (pose.visible(Skeleton.NOSE) && pose.visible(11) && pose.visible(12)) {
            val shoulder = abs(pose.x[11] - pose.x[12]) * w
            drawCircle(color, radius = (shoulder * 0.35f).coerceIn(h * 0.025f, h * 0.09f), center = pt(Skeleton.NOSE), style = androidx.compose.ui.graphics.drawscope.Stroke(stroke))
        }
        for (i in 11 until LANDMARKS) if (pose.visible(i)) drawCircle(Color.White, radius = stroke * 0.9f, center = pt(i))
    }
}
