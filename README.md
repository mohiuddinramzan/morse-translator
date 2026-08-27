# Morse Translator

Text ↔ Morse code converter with a sound-playback tab and a flashlight tab, packaged as an Android app with Capacitor and built via GitHub Actions.

## Termux setup

```bash
pkg update -y && pkg upgrade -y
pkg install git nodejs-lts -y
```

Unzip this project, then inside the folder:

```bash
cd morse-translator
git init
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npm install @capawesome/capacitor-torch
git add .
git commit -m "Initial commit: Morse code translator app"
git branch -M main
git remote add origin https://github.com/<your-username>/morse-translator.git
git push -u origin main
```

## Add the Android platform (one-time, locally)

```bash
npx cap add android
```

This creates the `android/` folder. Add the flashlight permission:

```bash
sed -i 's#<application#<uses-permission android:name="android.permission.FLASHLIGHT"/>\n    <application#' android/app/src/main/AndroidManifest.xml
```

Then commit and push the `android/` folder too:

```bash
git add android
git commit -m "Add Android platform"
git push
```

## Build

Push to `main` (or run the workflow manually from the Actions tab). The workflow installs dependencies, syncs Capacitor, and builds a debug APK. Download it from the run's **Artifacts** section.

## Notes

- The flashlight uses `@capawesome/capacitor-torch`. In a regular browser (no native app), the app falls back to flashing the screen so you can still test the timing.
- Package versions in `package.json` aren't pinned — `npm install` will fetch current compatible versions. If a future Capacitor major version changes the API, check https://capacitorjs.com and https://capawesome.io/docs/sdks/capacitor/torch/ before assuming this code still matches.
- If the GitHub Actions build fails on Java/Gradle version mismatch, try lowering `java-version` in `.github/workflows/build.yml` from `21` to `17`.
