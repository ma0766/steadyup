package com.steadyup.tv

/**
 * CDC STEADI 30-Second Chair Stand: "below average" scores by age and sex.
 * Source: CDC STEADI, "30-Second Chair Stand" assessment form, https://www.cdc.gov/steadi/
 * We only show CDC's published number next to the person's score. We never say what a score means for them.
 */
object Cdc {
    /** Index 0 means "skip" (not shared). Indexes 1..7 are the age bands. */
    val AGE_LABELS = listOf("Skip", "60 to 64", "65 to 69", "70 to 74", "75 to 79", "80 to 84", "85 to 89", "90 to 94")
    /** Index 0 means "skip". 1 = woman, 2 = man. */
    val SEX_LABELS = listOf("Skip", "Woman", "Man")

    // "Below average" is a score UNDER these numbers (CDC table): men / women
    private val MEN = intArrayOf(14, 12, 12, 11, 10, 8, 7)
    private val WOMEN = intArrayOf(12, 11, 10, 10, 9, 8, 4)

    /** The CDC below-average line for this age band and sex, or null when either was skipped. */
    fun belowAverageUnder(age: Int, sex: Int): Int? {
        if (age !in 1..7 || sex !in 1..2) return null
        return if (sex == 2) MEN[age - 1] else WOMEN[age - 1]
    }

    /** The two lines under the score. Plain, no verdict. */
    fun lines(age: Int, sex: Int): List<String> {
        val under = belowAverageUnder(age, sex)
        val first = if (under != null) "CDC lists under $under as below average for your age." else Sentences.CHAIR_GENERIC
        return listOf(first, Sentences.CHAIR_SHARE)
    }
}
