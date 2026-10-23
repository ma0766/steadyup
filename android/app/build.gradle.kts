import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Deployed URLs live in a committed file so a clean clone builds the same APK.
val endpoints: Map<*, *> = rootProject.file("../config/endpoints.json").let {
    if (it.exists()) JsonSlurper().parse(it) as Map<*, *> else emptyMap<String, String>()
}

android {
    namespace = "com.steadyup.tv"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.steadyup.tv"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "WS_URL", "\"${endpoints["wsUrl"] ?: ""}\"")
        buildConfigField("String", "WEB_URL", "\"${endpoints["webUrl"] ?: ""}\"")
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.tv:tv-material:1.0.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.zxing:core:3.5.3")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
