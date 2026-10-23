# Android toolchain (installed in WSL without sudo) + Windows adb for the emulator
export JAVA_HOME="$HOME/tools/jdk17"
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$HOME/tools/gradle/bin:$PATH"
export ADB="/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe"
