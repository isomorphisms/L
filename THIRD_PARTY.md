# Third-party and referenced material

`LICENSE` applies only to material that this repository's contributors have authority to license. Third-party dependencies, data, and referenced mathematical resources retain their own terms.

## LMFDB-derived identifiers and metadata

The starter L-function identifiers and nearby-object descriptors are derived from public LMFDB fields. This repository's GPL grant does not relicense LMFDB data or upstream LMFDB software. Preserve LMFDB attribution and upstream terms for any imported material.

## Wegert rendering lineage

The phase/log-modulus coloring and interaction experiment reuse ideas and implementation lineage from `isomorphisms/wegert`. Material copied or adapted from that project retains the license terms that apply there; this file does not alter them.

## Edriç-generated shader artifact

`shader/LWegert.idric` is the maintained shader-language source seam. `app/src/main/assets/l-wegert.frag` is the checked GLSL ES runtime artifact consumed by Android. Separate CI checks the shader source path; the F-Droid Android build consumes the checked artifact without downloading Edriç.

## Platform and toolchain

Android SDK/NDK components, Gradle, CMake, native_app_glue, system libraries, and OpenGL ES interfaces are external to this repository and remain under their upstream terms.
