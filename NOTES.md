# LMFDB interaction stub

The first screen should be a mathematical picture, not a database record.

## First-paint rule

1. Pick one bundled seed object.
2. Draw a coarse Wegert phase portrait immediately.
3. Yield.
4. Refine the portrait in chunks.
5. Only then expose metadata or richer database navigation.

The first stub deliberately makes no network request. LMFDB should become a source of objects and relationships, not a dependency for first paint.

## Interaction rule

Turn database fields and relationships into ordinary questions. A mutation should correspond to a real nearby object whenever possible.

Examples:

- What happens if I change weight 4 to 6?
- What happens if I change level 1 to 9?
- What happens if I change this character?
- What happens if I keep the conductor but change the character?
- What happens if the analytic rank changes from 0 to 1?
- What happens if I take the dual?
- What happens if I twist it?
- What happens if I keep level and weight and choose the next newform?

## Bundled seeds

The browser stub currently renders q-series on the upper half-plane:

- `E4`: level 1, weight 4 Eisenstein series.
- `E6`: level 1, weight 6 Eisenstein series.
- `9.4.a.a`: the level 9, weight 4 CM newform `η(3z)^8`.

These are cheap local examples for testing the interaction. The renderer should eventually accept L-functions `L(s)` on the complex s-plane as another evaluator rather than hard-coding modular forms.

## Next useful LMFDB adapter

A future object descriptor only needs enough information for the picture and nearby moves:

```text
id
kind
parameters
source
sample(real, imaginary)
neighbors[]
```

`neighbors[]` should carry the human question as well as the target object, so the interface never has to dump a parameter table just to make navigation possible.
