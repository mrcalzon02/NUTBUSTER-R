# Owner-approved live premium and UI art repair

The 41 files in the recovery manifest are the **same existing live asset IDs** with repaired pixels extracted from their matching original source objects. They are static committed PNGs. The original source atlases and every independent staging crop remain preserved under the adjacent recovery paths. No ordinary match-three nut sprites were regenerated.

Extraction uses high-opacity connected-component owners across the whole transparent atlas; nearby antialiasing and glow are assigned to the closest legitimate opaque core. Each icon is then given a padded 384 × 384 transparent canvas. A separate regression test decodes all PNG rows and rejects any visible pixels in the outer 12 px. The protected artwork CSV has updated byte hashes, without changing image paths, stable IDs or gameplay.

Do not re-slice or bulk-reassign during unrelated updates. Compare the immutable source atlas and the intended item identity before approving further modifications.
