# LMFDB interaction stub

The first screen should be a mathematical picture, not a database record.

## First-paint rule

1. Pick one bundled seed object.
2. Draw a coarse Wegert phase portrait immediately.
3. Yield.
4. Refine the portrait in chunks.
5. Only then expose metadata or richer database navigation.

The first stub deliberately makes no network request. LMFDB is a source of objects and relationships, not a dependency for first paint.

## Interaction rule

Turn database fields and relationships into ordinary questions. A mutation should correspond to a real nearby object whenever possible.

Examples:

- What happens if I change this character?
- What happens if I keep the conductor but change the character?
- What happens if the analytic rank changes from 0 to 1?
- What happens if I take the dual?
- What happens if I twist it?
- What happens if I keep level and weight and choose the next newform?

## First actual L-function slice

The Android renderer now bundles three degree-1 Dirichlet L-functions rather than using only modular-form q-series seeds:

- `1-3-3.2-r1-0-0`, from the primitive real quadratic character `3.2`.
- `1-2e2-4.3-r1-0-0`, from the primitive real quadratic character `4.3`.
- `1-5-5.4-r0-0-0`, from the primitive real quadratic character `5.4`.

They form a deliberately small comparison chain: keep degree 1, primitive, real, quadratic and move through conductors 3, 4, and 5. The exact questions and targets are bundled in `data/dirichlet-l-neighbors.json`.

This is an app-level notion of nearby objects derived from LMFDB fields, not a claim that LMFDB publishes a canonical neighbor graph.

The runtime uses

```text
L(s, chi) = q^(-s) * sum_a chi(a) * zeta(s, a/q)
```

with an Euler-Maclaurin continuation of Hurwitz zeta. That makes the rendered object an actual analytic continuation of `L(s, chi)` on the complex `s`-plane rather than a finite Dirichlet series that only makes sense on the right.

The old `E4`, `E6`, and `9.4.a.a` modular forms remain useful reference ideas, but they are no longer the three Android navigation objects.

## Object descriptor

The first descriptor is intentionally small:

```text
id
kind
parameters
source
neighbors[]
```

Each `neighbors[]` entry carries the human question as well as the target object, so the interface never has to dump a parameter table just to make navigation possible.
