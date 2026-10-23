package com.steadyup.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class S0SkeletonTest {
    @Test fun appNameIsSteadyUp() = assertEquals("SteadyUp", AppInfo.NAME)

    @Test fun taglineIsShortPlainLanguage() = assertTrue(AppInfo.TAGLINE.split(" ").size < 12)
}
