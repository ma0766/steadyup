package com.steadyup.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class S9WorldClassTest {
    private val plan = Catalog.parse("sit_to_stand:3,heel_raise:3")
    private fun real() = SessionMachine(plan, restSec = 2, firstRun = false, needsCalibration = true)

    // ---- personal calibration -------------------------------------------------------------------------------
    @Test fun firstSetWaitsForTwoSlowStands() {
        val m = real(); val fx = m.on(Ev.Ok, 0)
        assertEquals(Screen.Calibrate(Next.SESSION, 1, 0, false), m.screen)
        assertTrue(fx.contains(Fx.StartCalibration))
        m.on(Ev.CalProgress(1), 10); assertEquals(Screen.Calibrate(Next.SESSION, 1, 1, false), m.screen)
        m.on(Ev.Calibrated(true), 20)
        assertEquals(Screen.Intro(0), m.screen)                 // learned: on to the first set
    }

    @Test fun calibrationOnlyHappensOncePerRun() {
        val m = real(); m.on(Ev.Ok, 0); m.on(Ev.Calibrated(true), 1)
        m.on(Ev.Back, 2); m.on(Ev.Ok, 3)
        assertEquals(Screen.Intro(0), m.screen)
    }

    @Test fun unclearRetriesThenFallsBackToDefaultsSoTheSessionIsNeverStuck() {
        val m = real(); m.on(Ev.Ok, 0)
        var fx = m.on(Ev.Calibrated(false), 1)
        assertEquals(Screen.Calibrate(Next.SESSION, 2, 0, true), m.screen)
        assertTrue(fx.contains(Fx.StartCalibration))
        m.on(Ev.Calibrated(false), 2); assertEquals(Screen.Calibrate(Next.SESSION, 3, 0, true), m.screen)
        fx = m.on(Ev.Calibrated(false), 3)
        assertEquals(Screen.Intro(0), m.screen)                 // third unclear try: use the defaults
    }

    @Test fun okSkipsCalibrationAndUsesTheDefaults() {
        val m = real(); m.on(Ev.Ok, 0)
        val fx = m.on(Ev.Ok, 1)
        assertEquals(Screen.Intro(0), m.screen); assertTrue(fx.contains(Fx.StopCalibration))
    }

    // ---- CDC chair stand ------------------------------------------------------------------------------------
    @Test fun cdcBelowAverageTableMatchesTheForm() {
        // age band index 1..7 = 60-64 ... 90-94; sex 1 = woman, 2 = man
        val men = listOf(14, 12, 12, 11, 10, 8, 7); val women = listOf(12, 11, 10, 10, 9, 8, 4)
        for (i in 1..7) { assertEquals(men[i - 1], Cdc.belowAverageUnder(i, 2)); assertEquals(women[i - 1], Cdc.belowAverageUnder(i, 1)) }
        assertNull(Cdc.belowAverageUnder(0, 1)); assertNull(Cdc.belowAverageUnder(3, 0))
        assertEquals(listOf("60 to 64", "65 to 69", "70 to 74", "75 to 79", "80 to 84", "85 to 89", "90 to 94"), Cdc.AGE_LABELS.drop(1))
    }

    @Test fun cdcLinesShowTheNumberAndNeverADiagnosis() {
        assertEquals(listOf("CDC lists under 10 as below average for your age.", "Share this number with your doctor."), Cdc.lines(3, 1)) // woman 70-74
        assertEquals("CDC lists under 12 as below average for your age.", Cdc.lines(2, 2)[0])                                               // man 65-69
        assertEquals(Sentences.CHAIR_GENERIC, Cdc.lines(0, 0)[0])
        val all = (0..7).flatMap { a -> (0..2).flatMap { x -> Cdc.lines(a, x) } }.joinToString(" ").lowercase()
        for (w in listOf("risk", "diagnos", "fall", "weak", "you are", "you have")) assertFalse("claim: $w", all.contains(w))
    }

    @Test fun chairQuestionNoSkipsTheTest() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.OpenChair, 0); assertEquals(Screen.ChairAsk, m.screen)
        m.on(Ev.No, 1); assertEquals(Screen.ChairNo, m.screen)
        m.on(Ev.Ok, 2); assertEquals(Screen.Home, m.screen)
    }

    @Test fun chairTestRunsThirtySecondsAndSavesTheScore() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.OpenChair, 0); m.on(Ev.Yes, 1)
        assertEquals(Screen.ChairAbout(0, 0), m.screen)
        m.on(Ev.CycleAge, 2); m.on(Ev.CycleAge, 3); m.on(Ev.CycleSex, 4)           // 65 to 69, woman
        assertEquals(Screen.ChairAbout(2, 1), m.screen)
        m.on(Ev.Ok, 5); assertEquals(Screen.ChairHow(2, 1), m.screen)
        m.on(Ev.Ok, 1_000); assertEquals(Screen.ChairReady(3, 2, 1), m.screen)
        m.on(Ev.Tick, 2_000); assertEquals(Screen.ChairReady(2, 2, 1), m.screen)
        val go = m.on(Ev.Tick, 4_000)                                              // countdown over
        assertTrue(go.any { it is Fx.StartSet && it.item.move == "chair_stand_30" })
        assertEquals(Screen.ChairGo(0, 30, null, 2, 1), m.screen)
        m.on(Ev.Count(5), 10_000); m.on(Ev.Count(12), 30_000)
        assertEquals(12, (m.screen as Screen.ChairGo).count)
        m.on(Ev.Tick, 33_999); assertTrue(m.screen is Screen.ChairGo)
        val end = m.on(Ev.Tick, 34_000)                                            // 30 s after the start at 4 s
        assertEquals(Screen.ChairResult(12, 2, 1), m.screen)
        assertTrue(end.contains(Fx.EndSet)); assertTrue(end.contains(Fx.SaveChair(12, 2, 1)))
        m.on(Ev.Ok, 35_000); assertEquals(Screen.Home, m.screen)
    }

    @Test fun chairTestWaitsForCalibrationFirstWhenNeeded() {
        val m = real()
        m.on(Ev.OpenChair, 0); m.on(Ev.Yes, 1); m.on(Ev.Ok, 2); m.on(Ev.Ok, 3)
        assertEquals(Screen.Calibrate(Next.CHAIR, 1, 0, false), m.screen)
        m.on(Ev.Calibrated(true), 10_000)
        assertTrue(m.screen is Screen.ChairReady)
    }

    @Test fun chairScoresShowArmsReminderOnScreen() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.OpenChair, 0); m.on(Ev.Yes, 1); m.on(Ev.Ok, 2); m.on(Ev.Ok, 3); m.on(Ev.Tick, 4_000)
        m.on(Ev.Cue(Sentences.ARMS), 5_000)
        assertEquals(Sentences.ARMS, (m.screen as Screen.ChairGo).cue)
    }

    @Test fun chairWordsAreExactAndPlain() {
        assertEquals("Can you stand up from a chair without using your hands?", Sentences.CHAIR_ASK)
        assertEquals("Cross your arms on your chest.", Sentences.CHAIR_HOW_4)
        assertEquals("Do as many as you can in 30 seconds.", Sentences.CHAIR_HOW_6)
    }

    // ---- known gaps -----------------------------------------------------------------------------------------
    @Test fun backMidSetSavesTheRealRepsDone() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.Ok, 0); m.on(Ev.Ok, 0); m.on(Ev.Count(2), 10)
        val fx = m.on(Ev.Back, 20)
        val rec = fx.filterIsInstance<Fx.RecordSet>().single()
        assertEquals(2, rec.done); assertEquals("sit_to_stand", rec.item.move); assertEquals(Screen.Home, m.screen)
    }

    @Test fun backWithNothingDoneSavesNothing() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        assertTrue(m.on(Ev.Back, 5).none { it is Fx.RecordSet })
    }

    @Test fun finishedSetSavesItsFullTarget() {
        val m = SessionMachine(plan, firstRun = false)
        m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        val rec = m.on(Ev.Count(3), 10).filterIsInstance<Fx.RecordSet>().single()
        assertEquals(3, rec.done)
    }

    // ---- Fire TV readiness: Back always works ---------------------------------------------------------------
    @Test fun backNeverLeavesYouStuck() {
        // Every screen except Home (and the first safety screen) answers Back by returning to Home.
        fun reach(vararg evs: Ev): SessionMachine {
            val m = real(); var t = 0L
            for (e in evs) m.on(e, t++)
            return m
        }
        val paths = listOf(
            reach(Ev.OpenWeek), reach(Ev.OpenTogether), reach(Ev.OpenChair), reach(Ev.OpenChair, Ev.No), reach(Ev.OpenChair, Ev.Yes),
            reach(Ev.OpenChair, Ev.Yes, Ev.Ok), reach(Ev.Ok), reach(Ev.Ok, Ev.Calibrated(true)), reach(Ev.Ok, Ev.Calibrated(true), Ev.Ok),
            reach(Ev.Ok, Ev.Calibrated(true), Ev.Ok, Ev.Count(1)),
        )
        for (m in paths) { val before = m.screen.logName(); m.on(Ev.Back, 100); assertEquals("from $before", Screen.Home, m.screen) }
    }

    @Test fun homeAndSafetyLeaveBackToTheSystem() {
        val home = SessionMachine(plan, firstRun = false); home.on(Ev.Back, 0); assertEquals(Screen.Home, home.screen)
        val safety = SessionMachine(plan, firstRun = true); safety.on(Ev.Back, 0); assertEquals(Screen.Safety, safety.screen)
    }

    // ---- no speech engine: cues get bigger -------------------------------------------------------------------
    @Test fun withoutAVoiceCuesAreLarger() {
        assertTrue(cueSp(voice = false, isCue = true) > cueSp(voice = true, isCue = true))
        assertTrue(cueSp(voice = true, isCue = true) >= 40)
        assertTrue(cueSp(voice = false, isCue = false) >= 40)
    }
}
