# Nutvale Mining Tools — 86-sprite transparent art pack

The owner-approved source atlas contains **44 pickaxes and 42 gloves**. The
hand-painted icons match Nutvale Homestead artwork. They are **not numbered**
in any rendered asset. Each has a unique descriptive filename and persistent ID.

## Production method

Slicer: `tools/slice_nutvale_mining_tools.py` (Pillow, NumPy, SciPy).
Input (source SHA `feadd3e5ff57bd67dea318dec737e1c3d7daff2babdad46ec635a7006f487fed`):
`assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png`.

The top four rows contain eleven pickaxes each; the bottom three contain
fourteen gloves each. **Do not use an equal-sized rectangular crop on all rows.**
The slicer isolates high-opacity connected components in each row, then assigns
semi-transparent edges to the nearest full silhouette. It outputs 192×192
transparent RGBA PNGs, alpha-trimmed on a padded canvas. A border-opacity test
rejects clipped sprites; source hashes, unique output checksums, and object
counts are checked. Two unlabelled RGBA atlas images (11×4 pickaxes, 14×3
gloves) are produced for efficient rendering. Checkerboard previews are QA
references only and never used as in-game backgrounds.

**Expected paths:**
- `web/art/nutvale/mining-tools/pickaxes/<descriptive-name>.png` (44)
- `web/art/nutvale/mining-tools/gloves/<descriptive-name>.png` (42)
- `web/art/nutvale/mining-tools/atlas-pickaxes.png`
- `web/art/nutvale/mining-tools/atlas-gloves.png`
- `web/art/nutvale/mining-tools/manifest.json`

40 pickaxes and 40 gloves now map to **40 mechanical states each (0–39)** in the authorized equipment amendment `docs/wiki/Nutvale-Mines-Equipment-v1.1.md`. The extra four pickaxe and two glove variants are reserved as cosmetics; no 44- or 42-stage gameplay tiers have been invented. Pickaxe upgrades add +5 strikes/day and gloves add +1 scan/day.

## Delivery / verification status

The source atlas and **all 86 validated binaries** were uploaded to the NUTBUSTER Google Drive folder in [Nutvale_Mining_Tools_86_Transparent_Sprites.zip](https://drive.google.com/file/d/1ySfEltY1N0rS5w2RWOSxFh0WbHXaY_l2/view?usp=drivesdk). This repository document and slicer alone do **not**
mean the binary pack has been uploaded. The binary art requires unpacking at
the repository root before the game can reference those paths.

After installing the archive, regenerate with
`python tools/slice_nutvale_mining_tools.py`, verify manifest and alpha
checks, then include the source + produced images in a verified Git commit.

This does not change mining mechanics, monetization or campaign progression.
