#!/usr/bin/env python3
"""Slice the owner's approved Nutvale ore atlas; never synthesize substitute art.

Source: Google Drive's nutvale-mines-ore-atlas-approved.png (6 columns x 4 rows).
Usage: python tools/slice_nutvale_ore.py
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "web/art/nutvale/mines/nutvale-mines-ore-atlas-approved.png"
OUTPUT = ROOT / "web/art/nutvale/mining-ore"
EXPECTED_SHA256 = "e722b3a1b6e17e6ab5a30711f815eaee64f666a665de11988ea192abfab53db0"
CENTERS_X = (143, 375, 607, 840, 1072, 1305)
CENTERS_Y = (160, 402, 644, 887)
TILE_W, TILE_H = 222, 218


def checksum(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def run():
    if not SOURCE.is_file():
        raise FileNotFoundError("Missing owner's approved mining ore atlas: " + str(SOURCE))
    if checksum(SOURCE) != EXPECTED_SHA256:
        raise ValueError("Approved mining ore source SHA-256 mismatch; refusing to replace art")
    src = Image.open(SOURCE)
    if src.size != (1448, 1086) or src.mode != "RGB":
        raise ValueError("Approved ore atlas must be 1448x1086 RGB")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = []
    for row, cy in enumerate(CENTERS_Y, 1):
        for col, cx in enumerate(CENTERS_X, 1):
            left, top = cx - 111, cy - 109
            rgb = src.crop((left, top, left + TILE_W, top + TILE_H))
            pixels = np.asarray(rgb, dtype=np.int16)
            # Real tile vs. owner's near-black atlas background, not a recolor.
            mask = (pixels.max(axis=2) > 57) & (pixels.mean(axis=2) > 40)
            mask = ndi.binary_closing(mask, iterations=3)
            labels, count = ndi.label(mask)
            if count == 0:
                raise ValueError(f"No sprite found at {row},{col}")
            ids, areas = np.unique(labels[labels > 0], return_counts=True)
            mask = labels == ids[np.argmax(areas)]
            mask = ndi.binary_dilation(ndi.binary_fill_holes(mask), iterations=1)
            coverage = int(np.count_nonzero(mask))
            if coverage < 30000 or coverage > 49000:
                raise ValueError(f"Sprite bounds suspicious at {row},{col}: {coverage}")
            smooth = ndi.gaussian_filter(mask.astype(float), 1.0)
            alpha = np.uint8(np.clip((smooth - .12) / .76 * 255, 0, 255))
            rgba = Image.fromarray(np.dstack((np.asarray(rgb), alpha)), "RGBA")
            icon = Image.new("RGBA", (224, 224))
            icon.alpha_composite(rgba, (1, 3))
            name = f"r{row}c{col}.png"
            dest = OUTPUT / name
            icon.save(dest, optimize=True)
            bounds = icon.getbbox()
            if not bounds or bounds[0] < 1 or bounds[1] < 1 or bounds[2] > 223 or bounds[3] > 223:
                raise ValueError(f"Cropped sprite or incorrect alpha at {name}: {bounds}")
            result.append({
                "id": name[:-4],
                "path": "art/nutvale/mining-ore/" + name,
                "row": row, "column": col,
                "dimensions": [224, 224],
                "source_box": [left, top, left + TILE_W, top + TILE_H],
                "opaque_pixels": int(np.count_nonzero(alpha >= 128)),
                "sha256": checksum(dest),
            })
    if len(result) != 24 or len({s["sha256"] for s in result}) != 24:
        raise ValueError("Expected 24 unique ore/rock sprites")
    manifest = {
        "schema": "nutvale-approved-ore-sprites/v1",
        "source": "web/art/nutvale/mines/nutvale-mines-ore-atlas-approved.png",
        "source_drive_file_id": "1TeUAzgFkKEaAGDzKOSdz-l96P_z5fKuM",
        "source_sha256": EXPECTED_SHA256,
        "source_dimensions": [1448, 1086],
        "columns": 6, "rows": 4,
        "output_format": "224x224 transparent RGBA PNG",
        "slicer": "tools/slice_nutvale_ore.py",
        "sprites": result,
    }
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("PASS: approved Nutvale ore atlas verified, 24 unique transparent sprites sliced")


if __name__ == "__main__":
    run()
