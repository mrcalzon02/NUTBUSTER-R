# Assets and board geometry

**Artwork priority:** 1) `glossy_nut_match_3_icon_set.png`; 2) `glossy_puzzle_game_icon_collection.png`; 3) `glossy_nut_power_up_icon_grid.png`; 4) `glossy_nut_themed_game_icon_sprite_sheet.png`; 5) `glossy_caramel_puzzle_tile_asset_sheet.png`. 6) New high-resolution, text-labeled border illustration = *reference supplement only*.

`tools/prepare_assets.py` maps source grid cells to category/name, alpha trims, scales into 192×192 RGBA PNGs, then emits `web/art/primary/manifest.json` with sha256 digests. These are starting crops; visually QA individual fragments to catch illustration bleed across grid lines. Do not treat the newer labeled illustration's printed '64×64 grid' as precise sprite metadata.

## Board compositing

1. Board topology: 8×9 Boolean mask, void cells remove input, border and gravity support.
2. Bottom: alternating opaque caramel backing (tile sizing remains responsive).
3. Shape boundaries: four-neighbor edge mask (N/E/S/W); use four independent outside edge quads to avoid 47 expensive full tiles.
4. Convex/concave corners: corner overlays chosen by four cardinal neighbors plus diagonal neighbors. The original caramel border source is the art style anchor.
5. Mechanics: blockers use overlay layers, never replace the nut piece itself unless the mechanic explicitly occupies the cell.
6. Top: match effects, selection, hint and animations.

Void areas interrupt gravity by design. A column can contain multiple independent falling segments. Cross/portal mechanics are reserved for later gates; current levels do not implement cross-cell teleports.
