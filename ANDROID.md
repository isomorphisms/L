# Android prototype

This branch is now an actual degree-1 Dirichlet L-function phone experiment rather than only a modular-form seed viewer.

## Runtime boundary

- Android lifecycle and touch: `NativeActivity` + NDK `native_app_glue`.
- Rendering: GLES 3 fragment shader.
- Mathematical source seam: `shader/LWegert.idric`, checked through the existing Edric -> GLSL ES backend in CI.
- Packaged runtime shader: `app/src/main/assets/l-wegert.frag`; Edric bootstrap is not required on the phone.
- Bundled LMFDB-derived object/neighbor descriptors: `data/dirichlet-l-neighbors.json`.

The Android packaging files use Gradle, but there is no Java/Kotlin application source and `android:hasCode="false"`.

## First interaction

The portrait occupies the upper 82% of the screen.

- drag with one finger: pan the same complex-plane camera
- pinch with two fingers: zoom
- tap the bottom thirds: switch among `3.2`, `4.3`, and `5.4`

The three chips are the primitive real quadratic Dirichlet characters

- `3.2`: LMFDB L-function `1-3-3.2-r1-0-0`
- `4.3`: LMFDB L-function `1-2e2-4.3-r1-0-0`
- `5.4`: LMFDB L-function `1-5-5.4-r0-0-0`

The C gesture code is unchanged. In particular, selecting another object changes only `u_object`; center and zoom are preserved so the portraits can be compared point-for-point.

## Evaluator

For a primitive non-principal character modulo `q`, the shader uses

```text
L(s, chi) = q^(-s) * sum_a chi(a) * zeta(s, a/q)
```

and evaluates each Hurwitz zeta with a six-term Euler-Maclaurin continuation plus the `B2`, `B4`, and `B6` correction terms. This is an analytically continued L-function evaluator on the complex `s`-plane, not a Dirichlet-series truncation restricted to `Re(s) > 1`.

The character tables are deliberately tiny and inspectable:

```text
chi_3:  +1 at 1, -1 at 2
chi_4:  +1 at 1, -1 at 3
chi_5:  +1 at 1,4; -1 at 2,3
```

A tiny symmetric evaluation around `s = 1` avoids the removable numerical `0/0` caused by combining Hurwitz-zeta terms whose poles cancel for these non-principal characters.

This remains a float/GPU visual evaluator, not a replacement for Arb, PARI, Sage, or LMFDB numerical data. Accuracy is intended for stable Wegert portraits over the ordinary phone camera range.

## Neighbor semantics

The starter relationship is: keep degree 1, primitive, real, quadratic and move through conductors `3 -> 4 -> 5`. The questions and target IDs live in `data/dirichlet-l-neighbors.json`.

Those are app-level nearby moves derived from LMFDB metadata. They are not represented as a claim that LMFDB itself defines a canonical "neighbor" edge.

The phase palette is unchanged from the HCL Wegert renderer already used in `isomorphisms/wegert`: hue from argument, logarithmic modulus bands, chroma 45, and lightness around 66--73.

Android's system navigation area can overlay the extreme bottom edge on devices using three-button navigation. The mathematical navigation targets extend above that area; tap the labels rather than the device-navigation buttons.

## Build

```sh
gradle :app:assembleDebug
```

The debug APK is `app/build/outputs/apk/debug/app-debug.apk`.
