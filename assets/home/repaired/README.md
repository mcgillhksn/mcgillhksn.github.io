# Repaired skyline layers

`layer1.png` through `layer5.png` are the supplied revision-2 repairs, kept at
2070 × 1381 with their original alignment. Use them together: the revised right
hillside in layer 1 depends on the additional backing in layers 3–5. Layer 2 also
restores a small missing building detail.

The untouched source images remain one folder up. Layers 6–8 and the base
photograph still use those originals.

Run `npm run build` after replacing a repaired PNG. This generates the full-size
WebP fallbacks here, the trimmed desktop/portrait WebPs in `assets/optimized/home/`,
their CSS positions, and versioned image URLs. Do not edit generated WebPs directly.

During the build, `scripts/skyline-overlap.mjs` backs narrow cut edges with up to
three source pixels of neighboring texture, only where a fully opaque foreground
layer hides them at rest. This reduces resampling seams without expanding visible
rooflines or changing the supplied PNGs.
