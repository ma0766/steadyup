package com.steadyup.tv

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

/** Anything that can say a sentence. Real one is Android TextToSpeech; tests use a fake. */
interface Speaker { fun speak(text: String) }

/**
 * Spoken lines: never more than one every 5 seconds. A `force` line (before a set, pause, finish) beats cues in priority:
 * if it arrives too soon it waits and is spoken by tick() as soon as the gap has passed. Plain cues that arrive too soon are dropped.
 */
class SpeechGate(private val speaker: Speaker, private val minGapMs: Long = 5_000) {
    private var lastAt = Long.MIN_VALUE / 2
    private var pending: String? = null

    fun say(text: String, nowMs: Long, force: Boolean = false): Boolean {
        if (nowMs - lastAt >= minGapMs) { speakNow(text, nowMs); return true }
        if (force) pending = text
        return false
    }

    fun tick(nowMs: Long) {
        val p = pending ?: return
        if (nowMs - lastAt >= minGapMs) { pending = null; speakNow(p, nowMs) }
    }

    private fun speakNow(text: String, nowMs: Long) { lastAt = nowMs; if (text == pending) pending = null; speaker.speak(text) }
}

class TtsSpeaker(context: Context, private val onReady: (Boolean) -> Unit = {}) : Speaker {
    private var ready = false
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext) { status ->
        ready = status == TextToSpeech.SUCCESS
        if (ready) tts.language = Locale.US
        Log.i(TAG, "engine ready=$ready")
        onReady(ready) // no voice on this device: the screen shows cues bigger instead
    }

    override fun speak(text: String) {
        Log.i(TAG, "say: $text")  // test hook: adb logcat -s SteadyUpTts
        // A broken voice never blocks the session: we just stay quiet and the screen still shows the words.
        if (ready) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "su-${System.nanoTime()}")
    }

    fun shutdown() { tts.stop(); tts.shutdown() }
    companion object { const val TAG = "SteadyUpTts" }
}
