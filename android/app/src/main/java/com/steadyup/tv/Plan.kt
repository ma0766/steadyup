package com.steadyup.tv

/** One set in the session. Holds count seconds; everything else counts reps. */
data class PlanItem(
    val move: String,
    val title: String,
    val sentence: String,
    val target: Int,
    val isHold: Boolean = false,
    val side: String? = null,
)

object Catalog {
    private class Def(val title: String, val sentence: String, val hold: Boolean = false)

    private val defs = mapOf(
        "sit_to_stand" to Def("Sit to stand", "Stand up slowly. Then sit back down."),
        "heel_raise" to Def("Heel raises", "Rise up on your toes. Then lower slowly."),
        "side_leg_raise" to Def("Leg out to the side", "Lift one leg out to the side."),
        "march" to Def("March in place", "Lift one knee, then the other."),
        "tandem_hold" to Def("Foot in front", "Put one foot right in front of the other.", hold = true),
    )

    fun item(move: String, target: Int, side: String? = null): PlanItem {
        val d = defs[move] ?: throw IllegalArgumentException("unknown move: $move")
        val title = if (side != null) "${d.title}, $side" else d.title
        return PlanItem(move, title, d.sentence, target, d.hold, side)
    }

    /** About 10 minutes: six sets, then four more. Targets stay small and chair-supported. */
    fun defaultPlan(): List<PlanItem> = listOf(
        item("sit_to_stand", 8), item("heel_raise", 10),
        item("side_leg_raise", 8, "left"), item("side_leg_raise", 8, "right"),
        item("march", 12), item("tandem_hold", 20),
        item("sit_to_stand", 8), item("heel_raise", 10),
        item("march", 12), item("tandem_hold", 20),
    )

    private fun key(i: PlanItem) = i.move + (i.side?.let { "@$it" } ?: "")

    /** Apply this week's targets from the server. Unknown keys are ignored; a missing key keeps the current target. */
    fun withTargets(plan: List<PlanItem>, targets: Map<String, Int>): List<PlanItem> =
        plan.map { targets[key(it)]?.let { t -> it.copy(target = t) } ?: it }

    /** Test hook: "sit_to_stand:3,heel_raise:3,side_leg_raise@left:3". */
    fun parse(spec: String): List<PlanItem> = spec.split(",").filter { it.isNotBlank() }.map { part ->
        val (name, target) = part.trim().split(":")
        val (move, side) = name.split("@").let { it[0] to it.getOrNull(1) }
        item(move, target.toInt(), side)
    }
}
