package com.steadyup.tv

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class S2MirrorTest {
    private fun wire(vararg xy: Pair<Float, Float>): String {
        val p = StringBuilder()
        for (i in 0 until LANDMARKS) {
            val (x, y) = xy.getOrElse(i) { 0.5f to 0.5f }
            p.append("$x,$y,0.9,")
        }
        return """{"type":"pose","t":123,"p":[${p.toString().trimEnd(',')}]}"""
    }

    @Test fun parsesPoseFrameFromPhone() {
        val m = ServerMsg.parse(wire(0.25f to 0.75f))
        assertTrue(m is ServerMsg.Pose)
        m as ServerMsg.Pose
        assertEquals(123L, m.t)
        assertEquals(0.25f, m.frame.x[0], 1e-6f)
        assertEquals(0.75f, m.frame.y[0], 1e-6f)
    }

    @Test fun wrongPointCountIsUnreadableNotACrash() =
        assertEquals(ServerMsg.Unreadable, ServerMsg.parse("""{"type":"pose","t":1,"p":[0.1,0.2,0.9]}"""))

    @Test fun smootherMovesPartWayTowardNewPoint() {
        val s = PoseSmoother(alpha = 0.5f)
        val a = (ServerMsg.parse(wire(0f to 0f)) as ServerMsg.Pose).frame
        val b = (ServerMsg.parse(wire(1f to 1f)) as ServerMsg.Pose).frame
        assertEquals(0f, s.update(a).x[0], 1e-6f)
        assertEquals(0.5f, s.update(b).x[0], 1e-6f)
        assertEquals(0.75f, s.update(b).x[0], 1e-6f)
    }

    @Test fun resetForgetsHistory() {
        val s = PoseSmoother(alpha = 0.5f)
        val a = (ServerMsg.parse(wire(0f to 0f)) as ServerMsg.Pose).frame
        val b = (ServerMsg.parse(wire(1f to 1f)) as ServerMsg.Pose).frame
        s.update(a); s.reset()
        assertEquals(1f, s.update(b).x[0], 1e-6f)
    }

    @Test fun mirrorFlipsLeftAndRight() {
        assertEquals(0.8f, Skeleton.mirrorX(0.2f), 1e-6f)
        assertNotNull(Skeleton.BONES.firstOrNull())
    }

    @Test fun lowVisibilityPointsAreHidden() {
        val f = (ServerMsg.parse(wire()) as ServerMsg.Pose).frame
        assertTrue(f.visible(0))
        val hidden = PoseFrame(f.x, f.y, FloatArray(LANDMARKS) { 0.2f })
        assertTrue(!hidden.visible(0))
    }

    @Test fun jsonHelperStillParsesOtherTypes() {
        assertTrue(ServerMsg.parse("""{"type":"state","x":1}""") is ServerMsg.Other)
        assertNotNull(JSONObject("""{"a":1}"""))
    }
}
