package com.steadyup.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class S6WeekTest {
    private val json = """{"today":"2026-10-22","weekSessions":4,"prevWeekSessions":2,"streak":3,"days":[],
        "last":{"day":"2026-10-22","totals":[{"label":"Sit to stand","done":8,"unit":"reps"},{"label":"Foot in front","done":20,"unit":"seconds"}]}}"""

    @Test fun parsesSummaryWithUnits() {
        val s = WeekText.parse(json)!!
        assertEquals(4, s.weekSessions); assertEquals(3, s.streak)
        assertEquals(listOf("Sit to stand: 8", "Foot in front: 20 seconds"), s.last)
    }

    @Test fun badJsonIsNullNotACrash() = assertNull(WeekText.parse("<html>"))

    @Test fun plainLanguageLines() {
        val s = WeekText.parse(json)!!
        assertEquals("You exercised 4 times this week.", WeekText.sessions(s))
        assertEquals("3 days in a row.", WeekText.streak(s))
        assertEquals(Sentences.WEEK_NONE, WeekText.sessions(s.copy(weekSessions = 0)))
        assertEquals("You exercised once this week.", WeekText.sessions(s.copy(weekSessions = 1)))
        assertEquals(Sentences.WEEK_AGAIN, WeekText.streak(s.copy(streak = 0)))
    }

    @Test fun familyLinkCarriesTheHomeId() =
        assertEquals("https://x.example/family.html?h=abc", WeekText.familyLink("https://x.example/", "abc"))

    @Test fun finishingASetRecordsCountsOnly() {
        val m = SessionMachine(Catalog.parse("heel_raise:2"), restSec = 1, firstRun = false)
        val fx = ArrayList<Fx>()
        fx += m.on(Ev.Ok, 0); fx += m.on(Ev.Ok, 0); fx += m.on(Ev.Cue("Stand tall"), 10); fx += m.on(Ev.Count(2), 20)
        assertTrue(fx.contains(Fx.SessionStart))
        val rec = fx.filterIsInstance<Fx.RecordSet>().single()
        assertEquals("heel_raise", rec.item.move); assertEquals(1, rec.cues)
    }

    @Test fun weekScreenOpensFromHomeAndOkReturns() {
        val m = SessionMachine(Catalog.parse("march:2"), firstRun = false)
        assertTrue(m.on(Ev.OpenWeek, 0).contains(Fx.OpenWeek))
        assertEquals(Screen.Week, m.screen)
        m.on(Ev.Ok, 1); assertEquals(Screen.Home, m.screen)
        m.on(Ev.OpenWeek, 2); m.on(Ev.Back, 3); assertEquals(Screen.Home, m.screen)
        assertNotNull(m.screen)
    }
}
