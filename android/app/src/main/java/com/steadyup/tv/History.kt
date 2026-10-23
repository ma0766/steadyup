package com.steadyup.tv

import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

/** What the "This week" screen needs. Counts only. */
data class WeekSummary(val weekSessions: Int, val prevWeekSessions: Int, val streak: Int, val last: List<String>)

sealed class WeekState {
    object Loading : WeekState()
    data class Loaded(val summary: WeekSummary) : WeekState()
    object Failed : WeekState()
}

object WeekText {
    fun parse(json: String): WeekSummary? = try {
        val o = JSONObject(json)
        val last = o.optJSONObject("last")?.getJSONArray("totals")
        val lines = (0 until (last?.length() ?: 0)).map {
            val t = last!!.getJSONObject(it)
            "${t.getString("label")}: ${t.getInt("done")}" + if (t.optString("unit") == "seconds") " seconds" else ""
        }
        WeekSummary(o.getInt("weekSessions"), o.getInt("prevWeekSessions"), o.getInt("streak"), lines)
    } catch (e: Exception) { null }

    fun sessions(s: WeekSummary) = when (s.weekSessions) {
        0 -> Sentences.WEEK_NONE
        1 -> "You exercised once this week."
        else -> "You exercised ${s.weekSessions} times this week."
    }
    fun streak(s: WeekSummary) = when (s.streak) {
        0 -> Sentences.WEEK_AGAIN
        1 -> "1 day in a row."
        else -> "${s.streak} days in a row."
    }
    fun familyLink(webUrl: String, home: String) = "${webUrl.trimEnd('/')}/family.html?h=$home"
}

/** Talks to the history API. A failed save retries; a failed save never interrupts the session. */
class HistoryClient(private val apiUrl: String) {
    private val http = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()
    private val json = "application/json".toMediaType()

    fun recordSet(body: JSONObject) {
        if (apiUrl.isBlank()) return
        thread(name = "save-set") {
            for (attempt in 0 until 3) {
                try {
                    val req = Request.Builder().url("$apiUrl/sets").post(body.toString().toRequestBody(json)).build()
                    http.newCall(req).execute().use { if (it.isSuccessful) { Log.i(TAG, "saved set ${body.optString("move")}"); return@thread } }
                } catch (e: IOException) { Log.w(TAG, "save attempt $attempt failed: ${e.message}") }
                Thread.sleep(1000L * (attempt + 1))
            }
            Log.w(TAG, "could not save set")
        }
    }

    /** Ask the server to refresh the weekly plan after a session. Fire and forget: a failure keeps the current plan. */
    fun refreshPlan(home: String, then: () -> Unit) {
        if (apiUrl.isBlank()) return
        thread(name = "refresh-plan") {
            try { http.newCall(Request.Builder().url("$apiUrl/plan/refresh?home=$home").post("".toRequestBody(json)).build()).execute().close() }
            catch (e: IOException) { Log.w(TAG, "plan refresh failed: ${e.message}") }
            then()
        }
    }

    fun fetchPlan(home: String, onTargets: (Map<String, Int>) -> Unit) {
        if (apiUrl.isBlank()) return
        thread(name = "load-plan") {
            try {
                http.newCall(Request.Builder().url("$apiUrl/plan?home=$home").build()).execute().use { r ->
                    if (!r.isSuccessful) return@thread
                    val t = JSONObject(r.body?.string() ?: return@thread).getJSONObject("targets")
                    onTargets(t.keys().asSequence().associateWith { t.getInt(it) })
                }
            } catch (e: Exception) { Log.w(TAG, "plan load failed: ${e.message}") }
        }
    }

    fun fetchSummary(home: String, today: String, onResult: (WeekState) -> Unit) {
        thread(name = "load-week") {
            val state = try {
                val req = Request.Builder().url("$apiUrl/summary?home=$home&today=$today").build()
                http.newCall(req).execute().use { r ->
                    val parsed = if (r.isSuccessful) WeekText.parse(r.body?.string() ?: "") else null
                    if (parsed != null) WeekState.Loaded(parsed) else WeekState.Failed
                }
            } catch (e: IOException) { WeekState.Failed }
            onResult(state)
        }
    }

    companion object { const val TAG = "SteadyUpHistory" }
}
