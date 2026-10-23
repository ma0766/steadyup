package com.steadyup.tv

import org.json.JSONObject

const val LANDMARKS = 33

/** Body points only (never video): x,y in 0..1 image space plus how sure the phone was about each point. */
class PoseFrame(val x: FloatArray, val y: FloatArray, val visibility: FloatArray) {
    fun visible(i: Int, min: Float = 0.5f) = visibility[i] >= min
}

object PoseCodec {
    /** Wire format from the phone: p = [x,y,visibility] * 33 flattened. */
    fun fromWire(p: org.json.JSONArray): PoseFrame? {
        if (p.length() != LANDMARKS * 3) return null
        val x = FloatArray(LANDMARKS); val y = FloatArray(LANDMARKS); val v = FloatArray(LANDMARKS)
        for (i in 0 until LANDMARKS) {
            x[i] = p.getDouble(i * 3).toFloat()
            y[i] = p.getDouble(i * 3 + 1).toFloat()
            v[i] = p.getDouble(i * 3 + 2).toFloat()
        }
        return PoseFrame(x, y, v)
    }
}

/** Exponential moving average — a one-pole low-pass filter that hides camera jitter at the cost of a little lag. */
class PoseSmoother(private val alpha: Float = 0.55f) {
    private var prev: PoseFrame? = null

    fun update(f: PoseFrame): PoseFrame {
        val p = prev
        if (p == null) { prev = f; return f }
        val x = FloatArray(LANDMARKS) { p.x[it] + alpha * (f.x[it] - p.x[it]) }
        val y = FloatArray(LANDMARKS) { p.y[it] + alpha * (f.y[it] - p.y[it]) }
        val out = PoseFrame(x, y, f.visibility)
        prev = out
        return out
    }

    fun reset() { prev = null }
}

object Skeleton {
    const val NOSE = 0
    val BONES: List<Pair<Int, Int>> = listOf(
        11 to 12, 11 to 13, 13 to 15, 12 to 14, 14 to 16,
        11 to 23, 12 to 24, 23 to 24,
        23 to 25, 25 to 27, 27 to 29, 29 to 31, 27 to 31,
        24 to 26, 26 to 28, 28 to 30, 30 to 32, 28 to 32,
    )
    /** TV is a mirror: the person's right hand appears on the right of the screen. */
    fun mirrorX(x: Float) = 1f - x
}

/** A calm standing figure for the "picture" on the intro screen. */
object MovePicture {
    val standing: PoseFrame = run {
        val x = FloatArray(LANDMARKS) { 0.5f }; val y = FloatArray(LANDMARKS) { 0.5f }
        fun p(i: Int, px: Float, py: Float) { x[i] = px; y[i] = py }
        p(0, 0.5f, 0.12f)
        p(11, 0.44f, 0.24f); p(12, 0.56f, 0.24f); p(13, 0.41f, 0.38f); p(14, 0.59f, 0.38f); p(15, 0.40f, 0.50f); p(16, 0.60f, 0.50f)
        p(23, 0.46f, 0.52f); p(24, 0.54f, 0.52f); p(25, 0.46f, 0.72f); p(26, 0.54f, 0.72f); p(27, 0.46f, 0.92f); p(28, 0.54f, 0.92f)
        p(29, 0.45f, 0.94f); p(30, 0.55f, 0.94f); p(31, 0.43f, 0.95f); p(32, 0.57f, 0.95f)
        PoseFrame(x, y, FloatArray(LANDMARKS) { 1f })
    }
}
