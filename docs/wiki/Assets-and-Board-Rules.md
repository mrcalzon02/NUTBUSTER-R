# Assets and board geometry

**Artwork priority:** 1) `glossy_nut_match_3_icon_set.png`; 2) `glossy_puzzle_game_icon_collection.png`; 3) `glossy_nut_power_up_icon_grid.png`; 4) `glossy_nut_themed_game_icon_sprite_sheet.png`; 5) `glossy_caramel_puzzle_tile_asset_sheet.png`. 6) New high-resolution, text-labeled border illustration = *reference supplement only*.

`tools/prepare_assets.py` maps source grid cells to category/name, alpha trims, scales into 192×192 RGBA PNGs, then emits `web/art/primary/manifest.json` with sha256 digests. These are starting crops; visually QA individual fragments to catch illustration bleed across grid lines. Do not treat the newer labeled illustration's printed '64×64 grid' as precise sprite metadata.

## Board compositing

1. Board topology: variable Boolean mask. Levels 1–10 use 4×5, 11–30 5×6, 31–70 6×7, 71–140 7×8, and 141–500 8×9. Void cells remove input, border and gravity support.
2. Bottom: alternating opaque caramel backing (tile sizing remains responsive).
3. Shape boundaries: four-neighbor edge mask (N/E/S/W); use four independent outside edge quads to avoid 47 expensive full tiles.
4. Convex/concave corners: corner overlays chosen by four cardinal neighbors plus diagonal neighbors. The original caramel border source is the art style anchor.
5. Mechanics: blockers use overlay layers, never replace the nut piece itself unless the mechanic explicitly occupies the cell.
6. Top: match effects, selection, hint and animations. Keep the button grid mounted; independently move nut sprites using recorded pre-clear, post-clear, and post-gravity frames. Never substitute a full board rerender for gravity.

Every adjacent swap consumes a move even if no match occurs. Void areas interrupt gravity by design. A column can contain multiple independent falling segments. Cross/portal mechanics are reserved for later gates; current levels do not implement cross-cell teleports.

## Campaign nut introductions and illustrated blockers

The permanent core roster starts with peanut, walnut and almond, adding cashew at 101, hazelnut at 201, the **open green pistachio** at 301 and gold acorn at 401. Two distinctive standard expansion nuts join early: **coconut at 15** and **tiger nut at 35**. The remaining expansion introductions are pecan 80, Brazil nut 126, chestnut 172, macadamia 218, pine nut 264, hickory nut 310, beechnut 356, pili nut 402, candlenut 448. Only two expansion varieties are active at any one time: the newest introduction plus a deterministic rotating prior variety. This keeps 3–9 matchable types active per level instead of eventually flooding the board with 18. The pale `ginkgo-nut` looks like a closed pistachio, so it is permanently **retired from active play and the player-facing nut index**, while its asset and registry index remain in place for the locked asset contract. `pistachio.png` stays available; the rainbow nut is match-created only. Apply roster gating consistently to initial boards, gravity refills, shuffles/repairs and collection objectives.

Ice durability is illustrated with `blockers/ice-2.png` and `blockers/ice-1.png`; chains and chests use `blockers/chain-1.png`, `blockers/chain-2.png`, and `blockers/chest.png`. Their layer remains over the ordinary nut. The existing `effects/ice-shatter.png` renders cracking effects. Screen-reader tile labels describe the blocker and its remaining layers.
