# Android prototype

This branch turns the LMFDB/Wegert stub into a phone experiment without Java or Kotlin application code.

## Runtime boundary

- Android lifecycle and touch: `NativeActivity` + NDK `native_app_glue`.
- Rendering: GLES 3 fragment shader.
- Mathematical source seam: `shader/LWegert.idric`, checked through the existing Edric → GLSL ES backend in CI.
- Packaged first-build shader: `app/src/main/assets/l-wegert.frag` so bootstrapping Edric is not required on the phone.

The Android packaging files use Gradle, but there is no Java/Kotlin source tree and `android:hasCode="false"`.

## First interaction

The portrait occupies the upper 82% of the screen.

- drag with one finger: pan the same complex-plane camera
- pinch with two fingers: zoom
- tap the bottom thirds: switch among `E4`, `E6`, and `9.4.a.a = eta(3z)^8`

The camera is deliberately preserved when the object changes. The point is to see what changed in the function, not what changed because the viewport jumped.

The first GPU evaluator keeps terms through q^16. That is enough for a fast visual interaction stub on the initial upper-half-plane view; it is not intended as a general high-precision modular-form evaluator.

The phase palette follows the HCL Wegert renderer already used in `isomorphisms/wegert`: hue from argument, logarithmic modulus bands, chroma 45, and lightness around 66--73.

## Build

```sh
gradle :app:assembleDebug
```

The debug APK is `app/build/outputs/apk/debug/app-debug.apk`.
