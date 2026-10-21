# FX and Interface Art: Import Contract and Next Generation Batches

## Existing assets are primary

The owner-supplied five original glossy nut/icon sheets remain the authoritative game style. Existing `web/art/primary/*` game pieces and `web/art/additions/*` isolated effects, currencies and controls must be reused. New art is additive, never silently substituted for the original nuts.

`web/art/additions/manifest.json` already catalogs **59** extracted supplementary sprites. The game currently uses their interface icons and booster images; the campaign map reuses reward chest, booster pack, and VIP-crown icons for node types. The next artwork must fit those same shapes, shading and caramel/gold accents.

## Animation and button system

Create FX atlases at **256 × 256 pixels per frame**, transparent RGBA PNG (no painted checkerboard or white background), predictable grid, padded clear gutters, exact named frame counts. Use a JSON manifest, e.g. `{id,frames,frameWidth,frameHeight,fps,loop,anchor,source,sha256}`, and crop frames with an automated extractor. Never point gameplay at a mixed unlabeled collage. Render visual effects as nonblocking overlays; the match-three engine owns timing, logic and consequences; VFX can be muted/reduced separately.

**Generation batch A — moment-to-moment**: `match-pop` (8 frames @ 16 FPS), `nut-crack` (10 @ 20), `ice-shatter` (12 @ 24), `chain-break` (10 @ 20), `five-match-wild` (12 @ 18), `row-clear-trail` (10 @ 24). Bright, readable particles should remain legible at a tile diameter of 40–72 Android pixels.

**Generation batch B — absurd power-ups**: `shell-supernova` (16 @ 24), `rainbow-wipe` (12 @ 24), `rocket-launch` (12 @ 24), `mega-hammer` (12 @ 20), `board-shuffle-vortex` (16 @ 24), `color-erase` (12 @ 24). These all need distinct silhouettes, not merely a recolored circle of sparks.

**Generation batch C — parody economy**: `chest-opening` (12 @ 20), `premium-bundle-overkill` (16 @ 24), `coin-shower` (12 @ 20), `vip-crown` (10 @ 16), `life-refill` (10 @ 16), `timer-ready` (8 @ 12), `fake-purchase-free-reveal` (16 @ 20). Opening animations never gate the player from claiming rewards; skip instantly is always enabled.

**Generation batch D — interface/level markers**: isolated transparent, 256-pixel icons for `story`, `hard`, `challenge`, `timed`, `collection`, `treasure`, `booster`, `boss`, `gate`, `event`, `gift`, `daily`, `season`, `vip`, `currency`, `heart`, `settings`, `sound`, `music`, `back`, `zoom-in`, `zoom-out`, `skip`, `claim`. Match the existing UI pack. No words or level numbers inside icons; labels are programmatic for localization, accessibility, and correct scaling.

## Acceptance gates

1. Source artwork preserved, provenance + license recorded and SHA-256 inventoried.
2. Crop detects separate frames with real alpha and stable bounding boxes, no cut-off shadows or neighbors.
3. Test at 360 × 800 and 1920 × 1080. Important icons recognizable at 28–36 px; interactive targets at least 44 px.
4. Effects render at 30/60 FPS with no engine dependency on animation finishing; reduced-motion setting uses a single flash.
5. Asset conversion commits actual binaries, metadata, source mapping and smoke tests together to GitHub. Never claim an image is in an APK before a build artifact confirms it.

No local payment, ads, phone contacts, or paid transactions are necessary. The over-the-top monetization presentation stays intact until the user presses the apparent **PAY** or **BUY** control, which then reveals that the price is free and grants the item.
