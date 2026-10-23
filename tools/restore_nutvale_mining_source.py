#!/usr/bin/env python3
"""Restore the byte-identical Nutvale mining-tools owner source PNG from Git chunks.
Usage: python tools/restore_nutvale_mining_source.py
Does not overwrite an existing source unless it already matches the approved hash.
"""
import hashlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png"
SHA256 = "feadd3e5ff57bd67dea318dec737e1c3d7daff2babdad46ec635a7006f487fed"
PARTS = [DEST.with_name(DEST.name + f".part-{i:02d}") for i in range(1, 5)]
EXPECTED_SIZES = [789678, 789678, 789678, 789676]


def checksum(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(262144), b""):
            digest.update(chunk)
    return digest.hexdigest()


def restore():
    if DEST.exists():
        if checksum(DEST) != SHA256:
            raise ValueError(f"Refusing to overwrite a changed source: {DEST}")
        print(f"PASS: original source already present and verified: {DEST}")
        return DEST
    for part, size in zip(PARTS, EXPECTED_SIZES):
        if not part.is_file() or part.stat().st_size != size:
            raise FileNotFoundError(f"Missing or incorrect Git source part: {part}")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    temp = DEST.with_name(DEST.name + ".restoring")
    try:
        digest = hashlib.sha256()
        with temp.open("wb") as target:
            for part in PARTS:
                with part.open("rb") as src:
                    for chunk in iter(lambda: src.read(262144), b""):
                        target.write(chunk)
                        digest.update(chunk)
        if digest.hexdigest() != SHA256:
            raise ValueError("Reconstructed source SHA-256 mismatch")
        if temp.stat().st_size != sum(EXPECTED_SIZES):
            raise ValueError("Reconstructed source length mismatch")
        os.replace(temp, DEST)
    finally:
        if temp.exists():
            temp.unlink()
    print(f"PASS: restored exact source ({DEST.stat().st_size} bytes): {DEST}")
    return DEST


if __name__ == "__main__":
    restore()
