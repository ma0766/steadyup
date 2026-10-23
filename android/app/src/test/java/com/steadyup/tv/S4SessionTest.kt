package com.steadyup.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class S4SessionTest {
    private val plan = Catalog.parse("sit_to_stand:3,heel_raise:3,march:3")
    private fun machine(firstRun: Boolean = false) = SessionMachine(plan, restSec = 2, firstRun = firstRun)

    @Test fun firstRunShowsSafetyThenHome() {
        val m = machine(firstRun = true)
        assertEquals(Screen.Safety, m.screen)
        val fx = m.on(Ev.Ok, 0)
        assertEquals(Screen.Home, m.screen)
        assertTrue(fx.contains(Fx.SafetyDone))
    }

    @Test fun laterRunsSkipSafety() = assertEquals(Screen.Home, machine(firstRun = false).screen)

    @Test fun threeMoveSessionRunsStartToFinish() {
        val m = machine()
        var t = 0L
        val spoken = mutableListOf<Fx.Speak>()
        val started = mutableListOf<String>()
        fun send(e: Ev) { m.on(e, t).forEach { if (it is Fx.Speak) spoken += it; if (it is Fx.StartSet) started += it.item.move } }

        send(Ev.Ok)                                           // Home -> intro of move 0
        assertEquals(Screen.Intro(0), m.screen)
        send(Ev.Ok)                                           // I'm ready -> live
        assertEquals(Screen.Live(0, 0, null), m.screen)
        send(Ev.Count(1)); send(Ev.Count(2))
        assertEquals(Screen.Live(0, 2, null), m.screen)
        send(Ev.Count(3))                                     // target reached -> rest
        assertEquals(Screen.Rest(1, 2), m.screen)
        t += 1000; send(Ev.Tick)
        assertEquals(Screen.Rest(1, 1), m.screen)
        t += 1000; send(Ev.Tick)                              // rest over -> next intro
        assertEquals(Screen.Intro(1), m.screen)
        send(Ev.Ok); repeat(3) { send(Ev.Count(it + 1)) }
        assertEquals(Screen.Rest(2, 2), m.screen)
        send(Ev.Ok)                                           // skip rest
        assertEquals(Screen.Intro(2), m.screen)
        send(Ev.Ok); repeat(3) { send(Ev.Count(it + 1)) }

        val fin = m.screen as Screen.Finish
        assertEquals(listOf("Sit to stand" to 3, "Heel raises" to 3, "March in place" to 3), fin.totals)
        assertEquals(listOf("sit_to_stand", "heel_raise", "march"), started)
        // "Hold the back of the chair." before every set, and a sign-off at the end
        assertEquals(3, spoken.count { it.text == Sentences.HOLD_CHAIR })
        assertEquals(Sentences.WELL_DONE, spoken.last().text)
        send(Ev.Ok)
        assertEquals(Screen.Home, m.screen)
    }

    @Test fun cueShowsThenFadesAndIsSpoken() {
        val m = machine(); m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        val fx = m.on(Ev.Cue("Keep knees over toes"), 1000)
        assertEquals(Screen.Live(0, 0, "Keep knees over toes"), m.screen)
        assertTrue(fx.contains(Fx.Speak("Keep knees over toes")))
        m.on(Ev.Tick, 4000); assertTrue((m.screen as Screen.Live).cue != null)
        m.on(Ev.Tick, 5100); assertEquals(null, (m.screen as Screen.Live).cue)
    }

    @Test fun outOfViewTenSecondsPausesThenOkResumesAndKeepsCount() {
        val m = machine(); m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        m.on(Ev.Count(2), 500)
        val say = m.on(Ev.OutOfView, 1000)
        assertTrue(say.contains(Fx.Speak(Sentences.STEP_BACK)))
        m.on(Ev.Tick, 10_900); assertTrue(m.screen is Screen.Live)        // 9.9 s: still going
        val fx = m.on(Ev.Tick, 11_000)                                      // 10 s: pause
        assertEquals(Screen.Paused(0, 2), m.screen)
        assertTrue(fx.contains(Fx.Speak(Sentences.PAUSED, force = true)))
        m.on(Ev.Ok, 12_000)
        assertEquals(Screen.Live(0, 2, null), m.screen)
        m.on(Ev.Count(1), 13_000)                                           // phone restarts from 0; total = 2 + 1
        assertTrue(m.screen is Screen.Rest)
    }

    @Test fun backingInViewBeforeTenSecondsKeepsGoing() {
        val m = machine(); m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        m.on(Ev.OutOfView, 1000); m.on(Ev.InView, 5000); m.on(Ev.Tick, 20_000)
        assertTrue(m.screen is Screen.Live)
    }

    @Test fun backGoesHomeAndStopsTheSet() {
        val m = machine(); m.on(Ev.Ok, 0); m.on(Ev.Ok, 0)
        assertTrue(m.on(Ev.Back, 100).contains(Fx.EndSet))
        assertEquals(Screen.Home, m.screen)
    }

    @Test fun losingThePhoneMidSetPauses() {
        val m = machine(); m.on(Ev.Ok, 0); m.on(Ev.Ok, 0); m.on(Ev.Count(1), 10)
        m.on(Ev.PhoneLost, 20)
        assertEquals(Screen.Paused(0, 1), m.screen)
    }

    @Test fun speechGateAllowsOneCueEveryFiveSeconds() {
        val said = mutableListOf<String>()
        val gate = SpeechGate(object : Speaker { override fun speak(text: String) { said += text } })
        assertTrue(gate.say("a", 0))
        assertFalse(gate.say("b", 4_999))
        assertTrue(gate.say("c", 5_000))
        assertFalse(gate.say("d", 6_000))
        // a fixed line that arrives too soon waits for the gap instead of talking over the cue
        assertFalse(gate.say("fixed line", 6_500, force = true))
        gate.tick(9_999); assertEquals(listOf("a", "c"), said)
        gate.tick(10_000); assertEquals(listOf("a", "c", "fixed line"), said)
        assertFalse(gate.say("e", 12_000))
        assertTrue(gate.say("f", 15_000))
        // never two spoken lines closer than 5 s
        assertEquals(listOf("a", "c", "fixed line", "f"), said)
    }

    @Test fun holdTotalsShowTheirUnit() {
        val m = SessionMachine(Catalog.parse("tandem_hold:2"), restSec = 1, firstRun = false)
        m.on(Ev.Ok, 0); m.on(Ev.Ok, 0); m.on(Ev.Count(2), 100)
        assertEquals(listOf("Foot in front (seconds)" to 2), (m.screen as Screen.Finish).totals)
    }

    @Test fun planParsesSidesAndHolds() {
        val p = Catalog.parse("side_leg_raise@left:8,tandem_hold:20")
        assertEquals("left", p[0].side); assertEquals(8, p[0].target)
        assertTrue(p[1].isHold); assertEquals(20, p[1].target)
    }

    @Test fun defaultPlanHasAllFiveChairSupportedMoves() {
        val moves = Catalog.defaultPlan().map { it.move }.toSet()
        assertEquals(setOf("sit_to_stand", "heel_raise", "side_leg_raise", "march", "tandem_hold"), moves)
        assertTrue(Catalog.defaultPlan().none { !it.isHold && it.target > 15 })   // plan caps: max 15 reps
        assertTrue(Catalog.defaultPlan().none { it.isHold && it.target > 30 })    // max 30 s hold
    }

    @Test fun everyWordOnScreenIsShortAndPlain() {
        val banned = listOf("landmark", "websocket", "sync", " api", "error code", "server", "pose ")
        val all = Sentences.ALL + Catalog.defaultPlan().flatMap { listOf(it.title, it.sentence) }
        for (s in all) {
            for (sentence in s.split(Regex("[.?!]\\s*")).filter { it.isNotBlank() })
                assertTrue("too long: $sentence", sentence.trim().split(" ").size < 12)
            banned.forEach { assertFalse("tech word '$it' in: $s", " ${s.lowercase()} ".contains(it)) }
        }
    }
}
