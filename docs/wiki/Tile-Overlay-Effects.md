# Tile overlay effect sprites

The 16 translucent assets under `web/art/primary/overlays/` are **status overlays on existing nut cells**, never replacements for ordinary nut identities or the original match-created special-nut artwork.

## Asset authoring and reconstruction

The user-approved 4×4 source atlas is `assets/source/expansion/nut-tile-overlays-4x4.png`. Run `python3 tools/slice_tile_overlays.py` (Pillow) to regenerate 192×192 RGBA PNGs and `manifest.json` with SHA-256 checks. The script isolates the bomb's protruding lit fuse with a warm-pixel overflow crop, avoiding the storm sprite in the cell above. Every output has transparent edges and a semitransparent alpha channel: nominal alpha multipliers are 0.78, with sticky butter at 0.72 and the visually denser chain/bomb at 0.66.

## Currently functioning tile statuses

| Runtime field | Overlay | Rule |
| --- | --- | --- |
| `ice` | `frost.png` | Pinned tile; two or one hits to remove ice. Visible strength badge on two-hit ice; damage animation updates it. |
| `lock` | `chain-lock.png` | Pinned tile; remove the lock to release the nut. Master Key breaks all locks. |
| `jam` | `sticky-butter.png` | Fixed sticky surface layer; spreads every third turn, removed before deeper blockers. |
| `fuse` | `bomb.png` | Countdown overlay with remaining-turn badge; expiry deducts two moves. |

Chest still uses existing `blockers/chest.png`, with a remaining-hit badge. Frozen, chained and chest-covered tiles are pinned by the engine, **but their underlying ordinary nut stays visible beneath the artwork**. Their appearance must not be mistaken for a second whole-nut type.

## Art-only previews

`fire`, `lightning`, `water`, `nature-vines`, `poison`, `radiance`, `shadow`, `crystal`, `magma`, `storm`, `arcane`, and `void-rock` are not live tile mechanics and must not be automatically spawned. The Nut Index displays them as previews. They are available for separately specified future tile statuses, and do not change elemental whole-special-nut gameplay.

## Ordering and accessibility

Nut sprite below; full-tile translucent blocker ring or chest art next; surface butter and fuse effects above; small remaining-hit/fuse counters above those overlays. Screen-reader tile labels report the actual ordinary nut type and remaining blocker/fuse state. The board must still honor the pre-existing pinned-cell and gravity rules. Do not add opaque backplates over these PNGs. The art archive on Google Drive preserves original-resolution trimmed crops.
