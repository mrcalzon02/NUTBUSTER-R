# Nut Buster — original atlas recovery

The source atlases here are the **exact owner-uploaded originals**. They are committed directly to Git and must never be silently re-sliced on routine updates. The archive files contain independent transparent `384 × 384` PNG exports, the source-to-slice manifest with per-item SHA-256 digests and bounding boxes, and visual checkerboard QA sheets. Each ZIP can be extracted independently; combined they cover 73 non-nut images from four source atlases.

The extracted assets are **staged**, not installed over existing live sprites. That distinction is intentional: releasing a cosmetic icon replacement requires explicit source-to-target mapping verification and a visual QA check, followed by contract updates for any protected mappings. Ordinary nut tiles remain untouched.

One blocker key slice was corrected to eliminate an unrelated detached red fragment. `assets/recovery/original-non-nut/index.json` pins the exact archives and source hashes for readback and recovery.
