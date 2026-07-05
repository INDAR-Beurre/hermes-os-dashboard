#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIST="$PROJECT_ROOT/../hermes_cli/os_dashboard_dist"
ASSETS_DIR="$SCRIPT_DIR/app/src/main/assets"

echo "=== Hermes OS APK Builder ==="
echo ""

# Step 1: Build web assets
echo "[1/3] Building web dashboard..."
cd "$PROJECT_ROOT"
npm run build

# Step 2: Copy assets to Android project
echo "[2/3] Copying assets to Android project..."
mkdir -p "$ASSETS_DIR"
cp -r "$WEB_DIST"/* "$ASSETS_DIR"/
echo "  -> $(ls "$ASSETS_DIR" | tr '\n' ' ') copied"

# Step 3: Build APK
echo "[3/3] Building APK..."
cd "$SCRIPT_DIR"

if [ ! -d "$HOME/Android/Sdk" ]; then
    echo ""
    echo "ERROR: Android SDK not found at \$HOME/Android/Sdk"
    echo "Install Android Studio or set ANDROID_HOME"
    exit 1
fi

export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -f "$SCRIPT_DIR/gradlew" ]; then
    echo "Downloading Gradle wrapper..."
    gradle wrapper --gradle-version 8.5
fi

chmod +x "$SCRIPT_DIR/gradlew" 2>/dev/null || true
./gradlew assembleDebug 2>&1 | tail -20

APK="$SCRIPT_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
    echo ""
    echo "=== APK Ready ==="
    echo "Path: $APK"
    echo "Size: $(du -h "$APK" | cut -f1)"
    echo ""
    echo "Install: adb install $APK"
else
    echo ""
    echo "Build failed — check output above"
    exit 1
fi
